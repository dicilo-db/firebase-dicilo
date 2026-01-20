import { redirect } from 'next/navigation';

export default function AdsManagerPage() {
    redirect('/dashboard?view=ads-manager');
}
