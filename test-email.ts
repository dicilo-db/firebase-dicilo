import { sendWelcomeEmail } from './src/lib/email';
async function run() {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  await sendWelcomeEmail('test@example.com', 'Nilo', 'es', code);
  console.log("Called with code:", code);
}
run();
