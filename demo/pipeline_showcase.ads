// ========================================================
// AduScript Pipeline & Pattern Matching Showcase
// Demonstrates:
// - Advanced Pipeline Chains ('|>') with placeholders ('_')
// - Method shorthand pipeline ('.trim()', '.toUpperCase()')
// - Pattern matching across complex objects & ranges
// ========================================================

// 1. Raw Dataset
let rawTransactions = [
  { id: "TX-101", amount: 150.75, category: "cloud", status: "completed" },
  { id: "TX-102", amount: -45.00,  category: "refund", status: "pending" },
  { id: "TX-103", amount: 890.00, category: "enterprise", status: "completed" },
  { id: "TX-104", amount: 25.50,  category: "cdn", status: "completed" },
  { id: "TX-105", amount: 1200.0, category: "dedicated", status: "flagged" }
]

// 2. Pure Helper Functions
fn isCompleted(tx) -> tx.status == "completed"
fn extractAmount(tx) -> tx.amount
fn applyTax(amount, rate) -> amount * (1 + rate)
fn formatCurrency(val) -> f"${val.toFixed(2)}"

// 3. Elegant Pipeline Operator Stream
let totalRevenue = rawTransactions
  |> .filter(isCompleted)
  |> .map(extractAmount)
  |> .reduce((acc, x) -> acc + x, 0)
  |> applyTax(_, 0.08)
  |> formatCurrency()

console.log(f"Processed Total Revenue: {totalRevenue}")

// 4. Pattern Matching Classifier
fn classifyTransaction(tx) -> match tx with {
  { status: "flagged" }             => "⚠️ Security Review Required",
  { category: "refund" }            => "🔄 Process Refund Ticket",
  { amount: a } if a > 1000         => "💎 High Value Enterprise Settlement",
  { status: "completed", amount: a } => f"✅ Standard Settlement ({formatCurrency(a)})",
  _                                 => "ℹ️ Pending Routine Processing"
}

for tx in rawTransactions {
  let report = tx |> classifyTransaction()
  console.log(f"[{tx.id}] {report}")
}
