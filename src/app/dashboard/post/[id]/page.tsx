import { redirect } from 'next/navigation';

export default function DashboardPostRedirect({ params }: { params: { id: string } }) {
    // Redirect dashboard/post/[id] to post/[id] for consistency
    redirect(`/post/${params.id}`);
}
