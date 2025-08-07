const API_BASE = 'http://localhost:5000';

const remainingGuests = [
  { name: "Keong", capsule: "C1" },
  { name: "Keong Extended", capsule: "C23", collector: "Outstanding", isPaid: false },
  { name: "Prem", capsule: "C4" },
  { name: "Jeevan", capsule: "C5" },
  { name: "Ahmad", capsule: "C25" },
  { name: "Wei Ming", capsule: "C26" },
  { name: "Raj", capsule: "C11" },
  { name: "Hassan", capsule: "C12" },
  { name: "Li Wei", capsule: "C13" },
  { name: "Muthu", capsule: "C14" },
  { name: "Chen", capsule: "C15" },
  { name: "Kumar", capsule: "C17" },
  { name: "Farid", capsule: "C18" },
  { name: "Tan", capsule: "C19" },
  { name: "Ibrahim", capsule: "C21" },
  { name: "Wong", capsule: "C22" },
  { name: "Siva", capsule: "C24" },
];

async function getToken() {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' })
  });
  const data = await response.json();
  return data.token;
}

async function addGuests() {
  const token = await getToken();
  let added = 0;

  for (const guest of remainingGuests) {
    const payload = {
      name: guest.name,
      capsuleNumber: guest.capsule,
      expectedCheckoutDate: "2025-08-08",
      paymentAmount: "35",
      paymentMethod: "cash",
      paymentCollector: guest.collector || "Alston",
      isPaid: guest.isPaid !== false,
      notes: ""
    };

    try {
      const response = await fetch(`${API_BASE}/api/guests/checkin`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        console.log(`✓ ${guest.name} -> ${guest.capsule}`);
        added++;
      }
    } catch (error) {
      console.log(`✗ ${guest.name}: Error`);
    }
  }
  
  console.log(`\nAdded ${added}/${remainingGuests.length} remaining guests!`);
}

addGuests();
