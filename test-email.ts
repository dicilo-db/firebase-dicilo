import { broadcastGeneralInfoNewsletter } from './src/app/actions/admin-general-info';

async function run() {
    console.log("Testing broadcast...");
    try {
        const res = await broadcastGeneralInfoNewsletter({
            type: 'event',
            title: 'Prueba Local 2',
            description: 'Probando',
            url: 'https://test.com',
            time: '14:00',
            endTime: '15:00'
        });
        console.log("Result:", res);
    } catch (e) {
        console.error("Caught error:", e);
    }
}
run();
