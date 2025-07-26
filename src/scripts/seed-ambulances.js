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

const ambulances = [
    {
      ambulanceNumber: "KA-01-AB-1234",
      driverName: "Rajesh Kumar",
      driverContact: "9876543210",
      zone: "Zone A",
      isAvailable: true
    },
    {
      ambulanceNumber: "KA-02-CD-5678",
      driverName: "Anita Sharma",
      driverContact: "9123456789",
      zone: "Zone B",
      isAvailable: false
    },
    {
      ambulanceNumber: "KA-03-EF-9012",
      driverName: "Imran Ali",
      driverContact: "9345612789",
      zone: "Zone C",
      isAvailable: true
    },
    {
      ambulanceNumber: "KA-04-GH-3456",
      driverName: "Preeti Nair",
      driverContact: "7894561230",
      zone: "Zone D",
      isAvailable: false
    },
    {
      ambulanceNumber: "KA-05-IJ-7890",
      driverName: "Suresh Reddy",
      driverContact: "9012345678",
      zone: "Zone E",
      isAvailable: true
    }
];

async function seedDatabase() {
  console.log('Starting to seed ambulances collection...');
  const ambulanceCollection = collection(db, 'ambulances');
  let successCount = 0;
  let errorCount = 0;

  for (const ambulance of ambulances) {
    try {
      await addDoc(ambulanceCollection, ambulance);
      console.log(`Successfully added: ${ambulance.ambulanceNumber}`);
      successCount++;
    } catch (error) {
      console.error(`Error adding ${ambulance.ambulanceNumber}:`, error);
      errorCount++;
    }
  }

  console.log('\n--- Seeding Complete ---');
  console.log(`Successfully added ${successCount} documents.`);
  console.log(`Failed to add ${errorCount} documents.`);
  console.log('------------------------');
  process.exit(0);
}

seedDatabase();
