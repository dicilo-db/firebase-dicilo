const { getAssignedRecords } = require('./src/app/actions/freelance-records');

async function test() {
    const uid = '6OWAhwKRPZfaAUshsze7FUOsQ813';
    console.log("Calling getAssignedRecords for uid:", uid);
    const res = await getAssignedRecords(uid);
    console.log(res);
}

test().catch(console.error);
