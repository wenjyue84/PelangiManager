const API_BASE = 'http://localhost:5000';

const guestData = [
  { name: "Keong", capsule: "C1", phone: "017-6632979", checkin: "2025-08-07", checkout: "2025-08-08", nights: 1 },
  { name: "Keong (extended)", capsule: "C23", phone: "017-6632979", checkin: "2025-08-06", checkout: "2025-08-09", nights: 3, paymentStatus: "outstanding" },
  { name: "Prem", capsule: "C4", phone: "019-7418889", checkin: "2025-08-07", checkout: "2025-08-08", nights: 1 },
  { name: "Jeevan", capsule: "C5", phone: "010-5218906", checkin: "2025-08-07", checkout: "2025-08-08", nights: 1 },
  { name: "Ahmad", capsule: "C25", phone: "012-3456789", checkin: "2025-08-06", checkout: "2025-08-08", nights: 2 },
  { name: "Wei Ming", capsule: "C26", phone: "011-9876543", checkin: "2025-08-07", checkout: "2025-08-09", nights: 2 },
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
  { name: "David", capsule: "C2", phone: "016-7924579", checkin: "2025-08-07", checkout: "2025-08-08", nights: 1, note: "aware of room issues" },
  { name: "Ali", capsule: "C3", phone: "017-8135680", checkin: "2025-08-06", checkout: "2025-08-08", nights: 2, note: "aware of lock issue" },
  { name: "Robert", capsule: "C6", phone: "018-9246791", checkin: "2025-08-07", checkout: "2025-08-09", nights: 2, note: "aware of electrical issues" },
  { name: "Singh", capsule: "C16", phone: "019-1357902", checkin: "2025-08-07", checkout: "2025-08-08", nights: 1, note: "aware of lighting/fan issues" },
  { name: "Lim", capsule: "C20", phone: "010-2469013", checkin: "2025-08-06", checkout: "2025-08-08", nights: 2, note: "aware of light issue" },
];

async function getAuthToken() {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' })
  });
  
  if (response.ok) {
    const data = await response.json();
    return data.token;
  }
  return null;
}

async function populateGuests(token) {
  console.log('Adding guests with correct schema...');
  let created = 0;
  
  for (const guest of guestData) {
    const guestPayload = {
      name: guest.name,
      capsuleNumber: guest.capsule,
      expectedCheckoutDate: guest.checkout,
      paymentAmount: (guest.nights * 35).toString(),
      paymentMethod: "cash",
      paymentCollector: guest.paymentStatus === "outstanding" ? "Outstanding" : "Alston",
      isPaid: guest.paymentStatus !== "outstanding",
      notes: guest.note || null
    };

    try {
      const response = await fetch(`${API_BASE}/api/guests/checkin`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(guestPayload)
      });
      
      if (response.ok) {
        console.log(`✓ ${guest.name} -> ${guest.capsule} (${guest.paymentStatus === 'outstanding' ? 'payment pending' : 'paid'})`);
        created++;
      } else {
        const error = await response.text();
        console.log(`✗ ${guest.name}: ${error.substring(0, 100)}`);
      }
    } catch (error) {
      console.log(`✗ ${guest.name}: Network error`);
    }
  }
  
  return created;
}

async function main() {
  console.log('=== Final Guest Population ===\n');
  
  const token = await getAuthToken();
  if (!token) {
    console.log('Authentication failed');
    return;
  }
  
  const created = await populateGuests(token);
  console.log(`\n✅ Successfully added ${created}/${guestData.length} guests to Pelangi Capsule Hostel!`);
}

main().catch(console.error);
