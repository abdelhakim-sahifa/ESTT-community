'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db, ref, get, query, orderByChild, equalTo, runTransaction, set } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import ProjectSubmissionCard from '@/components/features/projects/ProjectSubmissionCard';
import {
    formatProjectDate,
    getDifficultyClasses,
    getProjectCategoryLabel,
    getProjectDifficultyLabel,
    getProjectRuntimeStatus,
    getProjectStatusClasses,
    getProjectStatusLabel,
    getProjectVoteModeLabel,
    normalizeProject,
    normalizeSubmission,
    sortByNewest,
} from '@/lib/projects';
import { AlertCircle, ArrowLeft, CalendarDays, CheckCircle2, Loader2, Trophy } from 'lucide-react';

const sortSubmissions = (items) =>
    [...items].sort((first, second) => (second.votesCount - first.votesCount) || sortByNewest(first, second));

async function fetchProjectByRest(projectId) {
    const response = await fetch(`https://estt-community-default-rtdb.firebaseio.com/projects/${projectId}.json`, {
        cache: 'no-store',
    });

    if (!response.ok) {
        throw new Error('REST project fetch failed');
    }

    return response.json();
}

async function fetchProjectSubmissionsByRest(projectId) {
    const response = await fetch(
        `https://estt-community-default-rtdb.firebaseio.com/projectSubmissions.json?orderBy="projectId"&equalTo="${projectId}"`,
        { cache: 'no-store' }
    );

    if (!response.ok) {
        throw new Error('REST submissions fetch failed');
    }

    return response.json();
}

export default function ProjectDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const projectId = Array.isArray(params?.projectId) ? params.projectId[0] : params?.projectId;

    const [project, setProject] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [currentVote, setCurrentVote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [votingId, setVotingId] = useState('');
    const [message, setMessage] = useState(null);

    useEffect(() => {
        if (!projectId) return;

        const fetchProject = async () => {
            setLoading(true);

            if (!db) {
                setLoading(false);
                return;
            }

            try {
                const [projectSnap, submissionsSnap, voteSnap] = await Promise.all([
                    get(ref(db, `projects/${projectId}`)),
                    get(query(ref(db, 'projectSubmissions'), orderByChild('projectId'), equalTo(projectId))),
                    user ? get(ref(db, `projectVotes/${projectId}/${user.uid}`)) : Promise.resolve(null),
                ]);

                let projectData = projectSnap.exists() ? projectSnap.val() : null;
                let submissionsData = submissionsSnap?.exists() ? submissionsSnap.val() : null;

                if (!projectData) {
                    projectData = await fetchProjectByRest(projectId);
                }

                if (!submissionsData) {
                    submissionsData = await fetchProjectSubmissionsByRest(projectId);
                }

                if (!projectData) {
                    setProject(null);
                    setSubmissions([]);
                    return;
                }

                setProject(normalizeProject(projectId, projectData));

                const submissionsList = submissionsData
                    ? Object.entries(submissionsData)
                        .map(([id, item]) => normalizeSubmission(id, item))
                        .filter((item) => item.status === 'approved')
                    : [];

                setSubmissions(sortSubmissions(submissionsList));
                setCurrentVote(voteSnap?.exists() ? voteSnap.val() : null);
            } catch (error) {
                console.error('Error loading project detail:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProject();
    }, [projectId, user]);

    const runtimeStatus = useMemo(() => getProjectRuntimeStatus(project), [project]);
    const leaderSubmission = submissions[0] || null;

    const handleVote = async (submission) => {
        if (!user) {
            router.push('/login');
            return;
        }

        if (!project || runtimeStatus !== 'open') {
            setMessage({
                type: 'error',
                text: 'Le vote est ferme pour ce challenge.',
            });
            return;
        }

        if (submission.authorId === user.uid) {
            setMessage({
                type: 'error',
                text: 'Tu ne peux pas voter pour ta propre implementation.',
            });
            return;
        }

        setVotingId(submission.id);
        setMessage(null);

        try {
            const voteRef = ref(db, `projectVotes/${projectId}/${user.uid}`);
            const existingVoteSnap = await get(voteRef);
            const existingVote = existingVoteSnap.exists() ? existingVoteSnap.val() : null;

            if (existingVote?.submissionId === submission.id) {
                setMessage({
                    type: 'success',
                    text: 'Ton vote est deja place sur cette implementation.',
                });
                return;
            }

            if (existingVote?.submissionId) {
                await runTransaction(
                    ref(db, `projectSubmissions/${existingVote.submissionId}/votesCount`),
                    (currentValue) => Math.max(0, Number(currentValue || 0) - 1)
                );
            }

            await runTransaction(
                ref(db, `projectSubmissions/${submission.id}/votesCount`),
                (currentValue) => Number(currentValue || 0) + 1
            );

            await set(voteRef, {
                userId: user.uid,
                projectId,
                submissionId: submission.id,
                createdAt: existingVote?.createdAt || Date.now(),
                updatedAt: Date.now(),
            });

            setCurrentVote({
                submissionId: submission.id,
                userId: user.uid,
            });

            setSubmissions((current) => {
                const next = current.map((item) => {
                    if (item.id === submission.id) {
                        return { ...item, votesCount: item.votesCount + 1 };
                    }

                    if (existingVote?.submissionId && item.id === existingVote.submissionId) {
                        return { ...item, votesCount: Math.max(0, item.votesCount - 1) };
                    }

                    return item;
                });

                return sortSubmissions(next);
            });

            setMessage({
                type: 'success',
                text: 'Ton vote a bien ete enregistre.',
            });
        } catch (error) {
            console.error('Error voting for submission:', error);
            setMessage({
                type: 'error',
                text: "Impossible d'enregistrer ton vote pour l'instant.",
            });
        } finally {
            setVotingId('');
        }
    };

    if (loading) {
        return (
            <main className="flex min-h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </main>
        );
    }

    if (!project) {
        return (
            <main className="container max-w-3xl px-4 py-16 text-center md:px-6">
                <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10">
                    <h1 className="text-3xl font-black text-slate-950">Projet introuvable</h1>
                    <p className="mt-3 text-sm text-slate-500">
                        Ce challenge n'existe plus ou son identifiant est invalide.
                    </p>
                    <Button asChild className="mt-6 rounded-full">
                        <Link href="/projects">Retour au hub</Link>
                    </Button>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[linear-gradient(180deg,_#0f172a_0%,_#172554_24%,_#eff6ff_24%,_#ffffff_100%)]">
            <section className="container px-4 py-12 md:px-6 md:py-16">
                <Button asChild variant="ghost" className="mb-6 rounded-full text-white hover:bg-white/10 hover:text-white">
                    <Link href="/projects">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Retour aux projets
                    </Link>
                </Button>

                <div className="overflow-hidden rounded-2xl border border-white/15 bg-white shadow-2xl shadow-slate-900/15">
                    <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
                        <div className="space-y-6 bg-slate-950 px-6 py-8 text-white md:px-8 md:py-10">
                            <div className="flex flex-wrap gap-2">
                                <Badge className={getProjectStatusClasses(runtimeStatus)}>
                                    {getProjectStatusLabel(runtimeStatus)}
                                </Badge>
                                <Badge className={getDifficultyClasses(project.difficulty)}>
                                    {getProjectDifficultyLabel(project.difficulty)}
                                </Badge>
                                <Badge className="border-white/15 bg-white/10 text-white">
                                    {getProjectCategoryLabel(project.category)}
                                </Badge>
                            </div>

                            <div className="space-y-3">
                                <h1 className="text-4xl font-black tracking-tight md:text-5xl">{project.title}</h1>
                                <p className="max-w-3xl text-base leading-relaxed text-white/80">
                                    {project.summary || project.description}
                                </p>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                                    <p className="text-xs uppercase tracking-[0.2em] text-white/50">Auteur</p>
                                    <p className="mt-2 text-sm font-bold">{project.authorName}</p>
                                </div>
                                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                                    <p className="text-xs uppercase tracking-[0.2em] text-white/50">Soumissions</p>
                                    <p className="mt-2 text-sm font-bold">{submissions.length}</p>
                                </div>
                                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                                    <p className="text-xs uppercase tracking-[0.2em] text-white/50">Vote</p>
                                    <p className="mt-2 text-sm font-bold">{getProjectVoteModeLabel(project.voteMode)}</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {project.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/80"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-5 bg-white px-6 py-8 md:px-8 md:py-10">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                                    <CalendarDays className="h-4 w-4" />
                                    Calendrier
                                </p>
                                <div className="mt-4 space-y-3 text-sm text-slate-600">
                                    <p>
                                        <span className="font-semibold text-slate-900">Cree le:</span> {formatProjectDate(project.createdAt)}
                                    </p>
                                    <p>
                                        <span className="font-semibold text-slate-900">Deadline:</span>{' '}
                                        {project.deadline ? formatProjectDate(project.deadline) : 'Aucune date limite'}
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Action</p>
                                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                                    Soumets ton build avec une demo, un repo GitHub et une explication claire. Les autres membres pourront ensuite voter.
                                </p>
                                <div className="mt-5 flex flex-wrap gap-3">
                                    {runtimeStatus === 'open' ? (
                                        <Button asChild className="rounded-full">
                                            <Link href={`/projects/${project.id}/submit`}>
                                                Soumettre une implementation
                                            </Link>
                                        </Button>
                                    ) : (
                                        <Button className="rounded-full" disabled>
                                            Soumissions fermees
                                        </Button>
                                    )}
                                    <Button asChild variant="outline" className="rounded-full">
                                        <Link href="/projects/showcase/new">Publier un projet libre</Link>
                                    </Button>
                                </div>
                            </div>

                            {leaderSubmission && (
                                <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                                    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-600">
                                        <Trophy className="h-4 w-4" />
                                        Leader actuel
                                    </p>
                                    <h2 className="mt-3 text-xl font-black text-slate-950">{leaderSubmission.title}</h2>
                                    <p className="mt-1 text-sm text-slate-600">
                                        {leaderSubmission.votesCount} vote{leaderSubmission.votesCount > 1 ? 's' : ''} pour {leaderSubmission.authorName}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <section className="container grid gap-8 px-4 pb-16 md:px-6 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="space-y-8">
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="text-2xl font-black text-slate-950">Description</h2>
                        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                            {project.description || project.summary || 'Aucune description detaillee pour le moment.'}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="text-2xl font-black text-slate-950">Attendus</h2>
                        {project.requirements.length > 0 ? (
                            <ul className="mt-4 space-y-3 text-sm text-slate-600">
                                {project.requirements.map((item) => (
                                    <li key={item} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="mt-4 text-sm text-slate-500">Aucun attendu detaille pour le moment.</p>
                        )}
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="text-2xl font-black text-slate-950">Criteres d evaluation</h2>
                        {project.evaluationCriteria.length > 0 ? (
                            <ul className="mt-4 space-y-3 text-sm text-slate-600">
                                {project.evaluationCriteria.map((item) => (
                                    <li key={item} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="mt-4 text-sm text-slate-500">Les criteres seront ajoutes par l'auteur du projet plus tard.</p>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h2 className="text-3xl font-black text-slate-950">Implementations</h2>
                            <p className="mt-2 text-sm text-slate-500">
                                La communaute vote sur la meilleure execution du meme brief.
                            </p>
                        </div>
                        <Button asChild variant="outline" className="rounded-full">
                            <Link href={`/projects/${project.id}/submit`}>Ajouter une implementation</Link>
                        </Button>
                    </div>

                    {message && (
                        <Alert className={message.type === 'error' ? '' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}>
                            {message.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                            <AlertTitle>{message.type === 'error' ? 'Attention' : 'Vote enregistre'}</AlertTitle>
                            <AlertDescription>{message.text}</AlertDescription>
                        </Alert>
                    )}

                    {submissions.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center">
                            <p className="text-lg font-bold text-slate-900">Aucune implementation pour le moment</p>
                            <p className="mt-2 text-sm text-slate-500">
                                Sois le premier a repondre a ce challenge et pose les bases du futur classement.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-6">
                            {submissions.map((submission) => (
                                <ProjectSubmissionCard
                                    key={submission.id}
                                    submission={submission}
                                    onVote={handleVote}
                                    voteDisabled={runtimeStatus !== 'open'}
                                    isVoting={votingId === submission.id}
                                    currentVoteId={currentVote?.submissionId || ''}
                                    userId={user?.uid || ''}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
}
