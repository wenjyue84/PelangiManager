// Script to populate current guest data from August 7th bookings
const guestData = [
  // Back section (C1-C6)
  { name: "Keong", capsule: "C1", phone: "017-6632979", checkin: "2025-08-07", checkout: "2025-08-08", nights: 1 },
  { name: "Keong (extended)", capsule: "C23", phone: "017-6632979", checkin: "2025-08-06", checkout: "2025-08-09", nights: 3, paymentStatus: "outstanding" },
  { name: "Prem", capsule: "C4", phone: "019-7418889", checkin: "2025-08-07", checkout: "2025-08-08", nights: 1 },
  { name: "Jeevan", capsule: "C5", phone: "010-5218906", checkin: "2025-08-07", checkout: "2025-08-08", nights: 1 },
  
  // Middle section (C25-C26)
  { name: "Ahmad", capsule: "C25", phone: "012-3456789", checkin: "2025-08-06", checkout: "2025-08-08", nights: 2 },
  { name: "Wei Ming", capsule: "C26", phone: "011-9876543", checkin: "2025-08-07", checkout: "2025-08-09", nights: 2 },
  
  // Front section (C11-C24, excluding problems)
  { name: "Raj", capsule: "C11", phone: "013-2468135", checkin: "2025-08-07", checkout: "2025-08-08", nights: 1 },
  { name: "Hassan", capsule: "C12", phone: "014-3579246", checkin: "2025-08-06", checkout: "2025-08-08", nights: 2 },
  { name: "Li Wei", capsule: "C13", phone: "015-4681357", checkin: "2025-08-07", checkout: "2025-08-10", nights: 3 },
  { name: "Muthu", capsule: "C14", phone: "016-5792468", checkin: "2025-08-07", checkout: "2025-08-08", nights: 1 },
  { name: "Chen", capsule: "C15", phone: "017-6813579", checkin: "2025-08-06", checkout: "2025-08-09", nights: 3 },
  { name: "Kumar", capsule: "C17", phone: "018-8135792", checkin: "2025-08-07", checkout: "2025-08-08", nights: 1 },
  { name: "Farid", capsule: "C18", phone: "019-9246813", checkin: "2025-08-06", checkout: "2025-08-08", nights: 2 },
  { name: "Tan", capsule: "C19", phone: "010-1357924", checkin: "2025-08-07", checkout: "2025-08-09", nights: 2 },
  { name: "Ibrahim", capsule: "C21", phone: "012-3579135", checkin: "2025-08-07", checkout: "2025-08-08", nights: 1 },
  { name: "Wong", capsule: "C22", phone: "013-4681246", checkin: "2025-08-06", checkout: "2025-08-08", nights: 2 },
  { name: "Siva", capsule: "C24", phone: "015-6813468", checkin: "2025-08-07", checkout: "2025-08-10", nights: 3 },
  
  // Additional guests for fuller occupancy
  { name: "David", capsule: "C2", phone: "016-7924579", checkin: "2025-08-07", checkout: "2025-08-08", nights: 1, note: "aware of room issues" },
  { name: "Ali", capsule: "C3", phone: "017-8135680", checkin: "2025-08-06", checkout: "2025-08-08", nights: 2, note: "aware of lock issue" },
  { name: "Robert", capsule: "C6", phone: "018-9246791", checkin: "2025-08-07", checkout: "2025-08-09", nights: 2, note: "aware of electrical issues" },
  { name: "Singh", capsule: "C16", phone: "019-1357902", checkin: "2025-08-07", checkout: "2025-08-08", nights: 1, note: "aware of lighting/fan issues" },
  { name: "Lim", capsule: "C20", phone: "010-2469013", checkin: "2025-08-06", checkout: "2025-08-08", nights: 2, note: "aware of light issue" },
];

// Base URL for API calls
const API_BASE = 'http://localhost:5000/api';

async function createGuest(guest) {
  const guestPayload = {
    name: guest.name,
    phone: guest.phone,
    capsuleNumber: guest.capsule,
    checkinTime: new Date(`${guest.checkin}T15:00:00`), // 3PM default checkin
    checkoutTime: guest.checkout === "2025-08-07" ? null : new Date(`${guest.checkout}T12:00:00`), // 12PM default checkout
    expectedCheckoutDate: guest.checkout,
    totalAmount: guest.nights * 35, // RM35 per night
    paymentMethod: "cash",
    paymentCollectedBy: guest.paymentStatus === "outstanding" ? null : "Alston", // Default collector
    paymentStatus: guest.paymentStatus || "paid",
    isCheckedIn: true,
    notes: guest.note || null
  };

  try {
    const response = await fetch(`${API_BASE}/guests/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(guestPayload)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log(`✓ Created guest: ${guest.name} in ${guest.capsule}`);
      return result;
    } else {
      const error = await response.text();
      console.log(`✗ Failed to create ${guest.name}: ${error}`);
    }
  } catch (error) {
    console.log(`✗ Network error for ${guest.name}: ${error.message}`);
  }
}

async function createDefaultUser() {
  try {
    const response = await fetch(`${API_BASE}/../setup-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123',
        role: 'admin'
      })
    });
    
    if (response.ok) {
      console.log('✓ Created default admin user');
    }
  } catch (error) {
    console.log('Admin user creation failed or already exists');
  }
}

async function populateAllData() {
  console.log('Setting up Pelangi Capsule Hostel data...\n');
  
  // Create default admin user
  await createDefaultUser();
  
  console.log('\nPopulating guest data...');
  
  // Create all guests
  for (const guest of guestData) {
    await createGuest(guest);
    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
  }
  
  console.log(`\n✓ Guest population complete! Created ${guestData.length} guests`);
  console.log('Login credentials: admin / admin123');
}

// Run if called directly
if (require.main === module) {
  populateAllData();
}

module.exports = { populateAllData };
