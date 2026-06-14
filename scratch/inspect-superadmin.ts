import { getWalletData } from '../src/app/actions/wallet';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
   const uid = '6OWAhwKRPZfaAUshsze7FUOsQ813';
   const data = await getWalletData(uid);
   console.log('getWalletData result:', data);
}
run();
