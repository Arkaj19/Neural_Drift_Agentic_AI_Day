// This script is intended to be run with Node.js to seed the database.
// It uses CommonJS require syntax.
require('dotenv').config({ path: './.env' });
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if all required environment variables are present
if (
  !firebaseConfig.apiKey ||
  !firebaseConfig.authDomain ||
  !firebaseConfig.projectId
) {
  console.error(
    'Firebase configuration is missing. Make sure your .env file is set up correctly.'
  );
  process.exit(1);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const medicalStaff = [
  {
    name: 'Dr. Anya Sharma',
    status: 'available',
    zone: 'Central City',
    contact_number: '+1234567890',
  },
  {
    name: 'Nurse Ben Carter',
    status: 'on_duty',
    zone: 'North District',
    contact_number: '+1987654321',
  },
  {
    name: 'Paramedic Chloe Green',
    status: 'available',
    zone: 'South County',
    contact_number: '+1122334455',
  },
  {
    name: 'EMT David Kim',
    status: 'on_break',
    zone: 'West Village',
    contact_number: '+1556677889',
  },
  {
    name: 'Dr. Elena Rossi',
    status: 'off_duty',
    zone: 'East Side',
    contact_number: '+1998877665',
  },
];

async function seedDatabase() {
  console.log('Starting to seed medical_staff collection...');
  const staffCollection = collection(db, 'medical_staff');
  let successCount = 0;
  let errorCount = 0;

  for (const staff of medicalStaff) {
    try {
      await addDoc(staffCollection, staff);
      console.log(`Successfully added: ${staff.name}`);
      successCount++;
    } catch (error) {
      console.error(`Error adding ${staff.name}:`, error);
      errorCount++;
    }
  }

  console.log('\n--- Seeding Complete ---');
  console.log(`Successfully added ${successCount} documents.`);
  console.log(`Failed to add ${errorCount} documents.`);
  console.log('------------------------');
  // The script will hang open due to the active Firestore connection.
  // We can exit manually, but for a simple script, this is okay.
  // In a more complex setup, you'd close the connection.
  process.exit(0);
}

seedDatabase();
