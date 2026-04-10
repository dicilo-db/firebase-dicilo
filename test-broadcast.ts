import { broadcastGeneralInfoNewsletter } from './src/app/actions/admin-general-info';

async function test() {
    try {
        const payload = {
            type: 'note' as const,
            title: 'Test Broadcast',
            description: 'Test description',
            url: '',
            date: '',
            time: '',
            endTime: ''
        };
        const result = await broadcastGeneralInfoNewsletter(payload);
        console.log('Result:', result);
    } catch (err) {
        console.error('Error:', err);
    }
}
test();
