import { supabase } from "@/integrations/supabase/client";

/**
 * ========================================
 * IDENTIFIANTS DE TEST
 * ========================================
 * Utilisez ces identifiants pour tester l'application.
 * Inscrivez-vous avec l'un de ces comptes, puis générez les données de test.
 */
export const TEST_CREDENTIALS = [
  { email: 'test@facture.gn', password: 'Test1234!' },
  { email: 'demo@facture.gn', password: 'Demo1234!' },
  { email: 'admin@facture.gn', password: 'Admin1234!' },
] as const;

const firstNames = ['Mamadou', 'Fatoumata', 'Ibrahima', 'Aissatou', 'Oumar', 'Mariama', 'Alpha', 'Kadiatou', 'Boubacar', 'Hawa', 'Sékou', 'Djénaba', 'Amadou', 'Fanta', 'Thierno', 'Binta', 'Souleymane', 'Aminata', 'Moussa', 'Oumou'];
const lastNames = ['Diallo', 'Barry', 'Camara', 'Sow', 'Bah', 'Sylla', 'Conté', 'Keita', 'Touré', 'Baldé', 'Bangoura', 'Soumah', 'Traoré', 'Kouyaté', 'Kanté'];
const cities = ['Conakry', 'Labé', 'Kankan', 'Kindia', 'Nzérékoré', 'Boké', 'Mamou', 'Faranah', 'Siguiri', 'Kissidougou'];
const products = [
  { name: 'Sac de riz 50kg', price: 150000 },
  { name: 'Huile végétale 20L', price: 200000 },
  { name: 'Ciment (sac)', price: 80000 },
  { name: 'Fer à béton (barre)', price: 50000 },
  { name: 'Téléphone smartphone', price: 800000 },
  { name: 'Ordinateur portable', price: 2500000 },
  { name: 'Imprimante', price: 450000 },
  { name: 'Climatiseur', price: 1200000 },
  { name: 'Réfrigérateur', price: 1800000 },
  { name: 'Téléviseur 43"', price: 950000 },
  { name: 'Motocyclette', price: 8000000 },
  { name: 'Générateur 5kVA', price: 3500000 },
  { name: 'Pompe à eau', price: 600000 },
  { name: 'Machine à coudre', price: 350000 },
  { name: 'Matériaux construction (lot)', price: 2000000 },
];

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function seedDemoData(companyId: string, userId: string, force: boolean = false) {
  // Check if company already has data
  if (!force) {
    const { data: existingClients } = await supabase
      .from('clients')
      .select('id')
      .eq('company_id', companyId)
      .limit(1);

    if (existingClients && existingClients.length > 0) {
      return { success: true, message: 'Données déjà existantes' };
    }
  }

  // Generate 50 clients
  const clients = [];
  for (let i = 0; i < 50; i++) {
    const firstName = randomElement(firstNames);
    const lastName = randomElement(lastNames);
    const city = randomElement(cities);
    clients.push({
      company_id: companyId,
      created_by: userId,
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@gmail.com`,
      phone: `+224 6${randomInt(20, 29)} ${randomInt(10, 99)} ${randomInt(10, 99)} ${randomInt(10, 99)}`,
      address: `Quartier ${['Madina', 'Kaloum', 'Ratoma', 'Matam', 'Dixinn', 'Centre-ville'][randomInt(0, 5)]}, ${city}`,
      city: city,
      country: 'Guinée',
    });
  }

  const { data: insertedClients, error: clientsError } = await supabase
    .from('clients')
    .insert(clients)
    .select();

  if (clientsError || !insertedClients) {
    console.error('Error inserting clients:', clientsError);
    return { success: false, message: 'Erreur lors de la création des clients' };
  }

  // Generate 500 invoices over the past 2 years
  const today = new Date();
  const invoices = [];
  const statuses: ('draft' | 'sent' | 'partial' | 'paid' | 'cancelled')[] = ['draft', 'sent', 'partial', 'paid', 'cancelled'];
  const statusWeights = [0.05, 0.15, 0.15, 0.55, 0.10];

  for (let i = 0; i < 500; i++) {
    const client = randomElement(insertedClients);
    const daysAgo = randomInt(0, 730);
    const issueDate = new Date(today.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const dueDate = new Date(issueDate.getTime() + randomInt(15, 45) * 24 * 60 * 60 * 1000);
    
    const rand = Math.random();
    let cumulative = 0;
    let status: typeof statuses[number] = 'sent';
    for (let j = 0; j < statuses.length; j++) {
      cumulative += statusWeights[j];
      if (rand < cumulative) {
        status = statuses[j];
        break;
      }
    }

    const numItems = randomInt(1, 5);
    let subtotal = 0;
    for (let k = 0; k < numItems; k++) {
      const product = randomElement(products);
      const qty = randomInt(1, 10);
      subtotal += product.price * qty;
    }
    
    const taxRate = 18;
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;
    
    let paidAmount = 0;
    if (status === 'paid') {
      paidAmount = total;
    } else if (status === 'partial') {
      paidAmount = Math.floor(total * (randomInt(20, 80) / 100));
    }
    
    const year = issueDate.getFullYear();
    const month = String(issueDate.getMonth() + 1).padStart(2, '0');

    invoices.push({
      company_id: companyId,
      created_by: userId,
      client_id: client.id,
      invoice_number: `FAC-${year}${month}-${String(i + 1).padStart(4, '0')}`,
      status,
      subtotal,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      total,
      paid_amount: paidAmount,
      issue_date: issueDate.toISOString().split('T')[0],
      due_date: dueDate.toISOString().split('T')[0],
      notes: status === 'paid' ? 'Paiement reçu avec remerciements' : null,
    });
  }

  // Insert invoices in batches of 100
  const allInsertedInvoices = [];
  for (let i = 0; i < invoices.length; i += 100) {
    const batch = invoices.slice(i, i + 100);
    const { data: insertedBatch, error: batchError } = await supabase
      .from('invoices')
      .insert(batch)
      .select();
    
    if (batchError) {
      console.error('Error inserting invoice batch:', batchError);
      continue;
    }
    if (insertedBatch) {
      allInsertedInvoices.push(...insertedBatch);
    }
  }

  // Create invoice items for each invoice
  const allItems = [];
  for (const invoice of allInsertedInvoices) {
    const numItems = randomInt(1, 5);
    
    for (let j = 0; j < numItems; j++) {
      const product = randomElement(products);
      const qty = randomInt(1, 10);
      const total = product.price * qty;
      
      allItems.push({
        invoice_id: invoice.id,
        description: product.name,
        quantity: qty,
        unit_price: product.price,
        total,
      });
    }
  }

  // Insert items in batches
  for (let i = 0; i < allItems.length; i += 500) {
    const batch = allItems.slice(i, i + 500);
    await supabase.from('invoice_items').insert(batch);
  }

  // Create payments for paid/partial invoices
  const payments = [];
  for (const invoice of allInsertedInvoices) {
    if (invoice.paid_amount > 0) {
      const numPayments = invoice.status === 'paid' ? randomInt(1, 2) : randomInt(1, 3);
      let remaining = invoice.paid_amount;
      const invoiceDate = new Date(invoice.issue_date);
      
      for (let p = 0; p < numPayments && remaining > 0; p++) {
        const paymentDate = new Date(invoiceDate.getTime() + randomInt(1, 30) * 24 * 60 * 60 * 1000);
        const amount = p === numPayments - 1 ? remaining : Math.floor(remaining * (randomInt(30, 60) / 100));
        remaining -= amount;
        
        payments.push({
          recorded_by: userId,
          invoice_id: invoice.id,
          amount,
          payment_type: amount >= invoice.total ? 'full' : 'partial',
          payment_method: randomElement(['cash', 'mobile_money', 'bank_transfer', 'check']),
          reference: `PAY-${Date.now()}-${randomInt(1000, 9999)}`,
          paid_at: paymentDate.toISOString(),
          notes: null,
        });
      }
    }
  }

  // Insert payments in batches
  for (let i = 0; i < payments.length; i += 100) {
    const batch = payments.slice(i, i + 100);
    await supabase.from('payments').insert(batch);
  }

  return { 
    success: true, 
    message: `${insertedClients.length} clients, ${allInsertedInvoices.length} factures et ${payments.length} paiements créés!` 
  };
}
