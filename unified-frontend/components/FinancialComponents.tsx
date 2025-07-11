
import React from 'react';

// Placeholder components for missing screens
const WalletScreen: React.FC = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Wallet</h1>
    <div className="bg-white p-4 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-semibold mb-2">Current Balance</h2>
      <p className="text-3xl font-bold text-green-600">$1,234.56</p>
    </div>
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-2">Recent Transactions</h2>
      <ul>
        <li className="flex justify-between items-center py-2 border-b border-gray-200">
          <span>Coffee Shop</span>
          <span className="text-red-500">-$4.50</span>
        </li>
        <li className="flex justify-between items-center py-2 border-b border-gray-200">
          <span>Salary Deposit</span>
          <span className="text-green-500">+$2,000.00</span>
        </li>
        <li className="flex justify-between items-center py-2">
          <span>Online Purchase</span>
          <span className="text-red-500">-$75.00</span>
        </li>
      </ul>
    </div>
  </div>
);


const TransactionHistory: React.FC = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Transaction History</h1>
    <div className="bg-white p-4 rounded-lg shadow-md">
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">Date</th>
            <th className="py-2 px-4 border-b">Description</th>
            <th className="py-2 px-4 border-b">Amount</th>
            <th className="py-2 px-4 border-b">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="py-2 px-4 border-b">2025-10-26</td>
            <td className="py-2 px-4 border-b">Coffee Shop</td>
            <td className="py-2 px-4 border-b text-red-500">-$4.50</td>
            <td className="py-2 px-4 border-b">Completed</td>
          </tr>
          <tr>
            <td className="py-2 px-4 border-b">2025-10-25</td>
            <td className="py-2 px-4 border-b">Salary Deposit</td>
            <td className="py-2 px-4 border-b text-green-500">+$2,000.00</td>
            <td className="py-2 px-4 border-b">Completed</td>
          </tr>
          <tr>
            <td className="py-2 px-4 border-b">2025-10-24</td>
            <td className="py-2 px-4 border-b">Online Purchase</td>
            <td className="py-2 px-4 border-b text-red-500">-$75.00</td>
            <td className="py-2 px-4 border-b">Completed</td>
          </tr>
          <tr>
            <td className="py-2 px-4 border-b">2025-10-23</td>
            <td className="py-2 px-4 border-b">Restaurant Bill</td>
            <td className="py-2 px-4 border-b text-red-500">-$30.00</td>
            <td className="py-2 px-4 border-b">Completed</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);


const SendMoney: React.FC = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Send Money</h1>
    <div className="bg-white p-4 rounded-lg shadow-md">
      <form>
        <div className="mb-4">
          <label htmlFor="recipient" className="block text-gray-700 text-sm font-bold mb-2">Recipient:</label>
          <input type="text" id="recipient" name="recipient" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" placeholder="Recipient's Name or Account" />
        </div>
        <div className="mb-4">
          <label htmlFor="amount" className="block text-gray-700 text-sm font-bold mb-2">Amount:</label>
          <input type="number" id="amount" name="amount" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" placeholder="0.00" />
        </div>
        <div className="mb-4">
          <label htmlFor="currency" className="block text-gray-700 text-sm font-bold mb-2">Currency:</label>
          <select id="currency" name="currency" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
            <option>USD</option>
            <option>EUR</option>
            <option>GBP</option>
          </select>
        </div>
        <div className="mb-6">
          <label htmlFor="notes" className="block text-gray-700 text-sm font-bold mb-2">Notes (Optional):</label>
          <textarea id="notes" name="notes" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" placeholder="Add a note"></textarea>
        </div>
        <div className="flex items-center justify-between">
          <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">Send Money</button>
        </div>
      </form>
    </div>
  </div>
);


const ReceiveMoney: React.FC = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Receive Money</h1>
    <div className="bg-white p-4 rounded-lg shadow-md text-center">
      <h2 className="text-xl font-semibold mb-4">Scan to Receive</h2>
      <img src="https://via.placeholder.com/200" alt="QR Code" className="mx-auto mb-4" />
      <p className="text-gray-700">Share this QR code or your account details to receive money.</p>
      <div className="mt-6 text-left">
        <h3 className="text-lg font-semibold mb-2">Your Account Details:</h3>
        <p><strong>Bank Name:</strong> Flowlet Bank</p>
        <p><strong>Account Number:</strong> 1234 5678 9012 3456</p>
        <p><strong>Account Name:</strong> John Doe</p>
        <p><strong>SWIFT/BIC:</strong> FLOWLTXX</p>
      </div>
    </div>
  </div>
);


const CardsScreen: React.FC = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Cards</h1>
    <div className="bg-white p-4 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-semibold mb-2">Your Cards</h2>
      <ul>
        <li className="flex justify-between items-center py-2 border-b border-gray-200">
          <span>Visa **** 1234</span>
          <button className="bg-blue-500 hover:bg-blue-700 text-white text-sm py-1 px-3 rounded">View Details</button>
        </li>
        <li className="flex justify-between items-center py-2 border-b border-gray-200">
          <span>Mastercard **** 5678</span>
          <button className="bg-blue-500 hover:bg-blue-700 text-white text-sm py-1 px-3 rounded">View Details</button>
        </li>
        <li className="flex justify-between items-center py-2">
          <span>Amex **** 9012</span>
          <button className="bg-blue-500 hover:bg-blue-700 text-white text-sm py-1 px-3 rounded">View Details</button>
        </li>
      </ul>
      <button className="mt-4 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">Add New Card</button>
    </div>
  </div>
);


const CardDetails: React.FC = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Card Details</h1>
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Visa **** 1234</h2>
      <div className="mb-4">
        <p><strong>Card Number:</strong> **** **** **** 1234</p>
        <p><strong>Card Holder:</strong> John Doe</p>
        <p><strong>Expiry Date:</strong> 12/28</p>
        <p><strong>CVV:</strong> ***</p>
      </div>
      <div className="flex space-x-4">
        <button className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">Block Card</button>
        <button className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded">Freeze Card</button>
      </div>
    </div>
  </div>
);


const IssueCard: React.FC = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Issue New Card</h1>
    <div className="bg-white p-4 rounded-lg shadow-md">
      <form>
        <div className="mb-4">
          <label htmlFor="cardType" className="block text-gray-700 text-sm font-bold mb-2">Card Type:</label>
          <select id="cardType" name="cardType" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
            <option>Visa</option>
            <option>Mastercard</option>
            <option>Amex</option>
          </select>
        </div>
        <div className="mb-4">
          <label htmlFor="cardName" className="block text-gray-700 text-sm font-bold mb-2">Name on Card:</label>
          <input type="text" id="cardName" name="cardName" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" placeholder="John Doe" />
        </div>
        <div className="flex items-center justify-between">
          <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">Issue Card</button>
        </div>
      </form>
    </div>
  </div>
);


const AnalyticsScreen: React.FC = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Analytics Dashboard</h1>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-2">Spending Trends</h2>
        <p>Chart showing spending over time (e.g., bar chart, line chart).</p>
        <div className="h-48 bg-gray-100 flex items-center justify-center">[Chart Placeholder]</div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-2">Category Breakdown</h2>
        <p>Pie chart showing spending by category.</p>
        <div className="h-48 bg-gray-100 flex items-center justify-center">[Chart Placeholder]</div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-2">Income vs. Expenses</h2>
        <p>Comparison of income and expenses.</p>
        <div className="h-48 bg-gray-100 flex items-center justify-center">[Chart Placeholder]</div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-2">Key Metrics</h2>
        <p>Total transactions: <strong>150</strong></p>
        <p>Average transaction value: <strong>$50.00</strong></p>
        <p>Most spent category: <strong>Food</strong></p>
      </div>
    </div>
  </div>
);


const ChatbotScreen: React.FC = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">AI Assistant</h1>
    <div className="bg-white p-4 rounded-lg shadow-md flex flex-col h-96">
      <div className="flex-grow overflow-y-auto mb-4 p-2 border rounded-md">
        <div className="flex justify-end mb-2">
          <div className="bg-blue-500 text-white p-2 rounded-lg max-w-xs">Hello, how can I help you today?</div>
        </div>
        <div className="flex justify-start mb-2">
          <div className="bg-gray-200 p-2 rounded-lg max-w-xs">I need help with my recent transaction.</div>
        </div>
      </div>
      <div className="flex">
        <input type="text" className="flex-grow shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" placeholder="Type your message..." />
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-r">Send</button>
      </div>
    </div>
  </div>
);


const FraudAlerts: React.FC = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Fraud Alerts</h1>
    <div className="bg-white p-4 rounded-lg shadow-md">
      <ul>
        <li className="flex justify-between items-center py-2 border-b border-gray-200">
          <span>Unusual activity detected on your card ending in 1234.</span>
          <button className="bg-red-500 hover:bg-red-700 text-white text-sm py-1 px-3 rounded">Review</button>
        </li>
        <li className="flex justify-between items-center py-2 border-b border-gray-200">
          <span>Large transaction from an unknown merchant.</span>
          <button className="bg-red-500 hover:bg-red-700 text-white text-sm py-1 px-3 rounded">Review</button>
        </li>
        <li className="flex justify-between items-center py-2">
          <span>Login attempt from an unrecognized device.</span>
          <button className="bg-red-500 hover:bg-red-700 text-white text-sm py-1 px-3 rounded">Review</button>
        </li>
      </ul>
    </div>
  </div>
);


const AIFraudDetectionScreen: React.FC = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">AI Fraud Detection</h1>
    <div className="bg-white p-4 rounded-lg shadow-md">
      <p className="mb-4">Our AI-powered system continuously monitors your transactions for suspicious activity.</p>
      <div className="flex items-center justify-between mb-4">
        <span className="text-lg font-semibold">Status:</span>
        <span className="text-green-600 font-bold">Active and Monitoring</span>
      </div>
      <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">View Detailed Report</button>
    </div>
  </div>
);


const SecurityScreen: React.FC = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Security Settings</h1>
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="mb-4 flex justify-between items-center">
        <span>Two-Factor Authentication (2FA)</span>
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Enable/Disable</button>
      </div>
      <div className="mb-4 flex justify-between items-center">
        <span>Change Password</span>
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Change</button>
      </div>
      <div className="mb-4 flex justify-between items-center">
        <span>Manage Authorized Devices</span>
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Manage</button>
      </div>
    </div>
  </div>
);


const SettingsScreen: React.FC = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Settings</h1>
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Profile Settings</h2>
        <p>Update your personal information, email, and phone number.</p>
        <button className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Edit Profile</button>
      </div>
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Notification Preferences</h2>
        <p>Manage how you receive alerts and updates.</p>
        <button className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Manage Notifications</button>
      </div>
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Privacy Settings</h2>
        <p>Control your data privacy and sharing options.</p>
        <button className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Manage Privacy</button>
      </div>
    </div>
  </div>
);


const EnhancedSecurityScreen: React.FC = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Enhanced Security</h1>
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="mb-4 flex justify-between items-center">
        <span>Multi-Factor Authentication (MFA)</span>
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Configure</button>
      </div>
      <div className="mb-4 flex justify-between items-center">
        <span>Biometric Login</span>
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Enable/Disable</button>
      </div>
      <div className="mb-4 flex justify-between items-center">
        <span>Security Alerts & Notifications</span>
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Manage</button>
      </div>
      <div className="mb-4 flex justify-between items-center">
        <span>Device Management</span>
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">View Devices</button>
      </div>
      <div className="mb-4 flex justify-between items-center">
        <span>Transaction Signing</span>
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Enable/Disable</button>
      </div>
    </div>
  </div>
);


const AdvancedBudgetingScreen: React.FC = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Advanced Budgeting</h1>
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-2">Budget Overview</h2>
      <p className="mb-4">Track your spending and set financial goals.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-100 p-3 rounded-md">
          <h3 className="font-semibold">Monthly Income:</h3>
          <p className="text-green-600 text-lg">$3,500.00</p>
        </div>
        <div className="bg-gray-100 p-3 rounded-md">
          <h3 className="font-semibold">Monthly Expenses:</h3>
          <p className="text-red-600 text-lg">$2,100.00</p>
        </div>
        <div className="bg-gray-100 p-3 rounded-md">
          <h3 className="font-semibold">Remaining Budget:</h3>
          <p className="text-blue-600 text-lg">$1,400.00</p>
        </div>
      </div>
      <h2 className="text-xl font-semibold mb-2">Budget Categories</h2>
      <ul>
        <li className="flex justify-between items-center py-2 border-b border-gray-200">
          <span>Housing</span>
          <span>$1,000 / $1,200</span>
        </li>
        <li className="flex justify-between items-center py-2 border-b border-gray-200">
          <span>Food</span>
          <span>$400 / $500</span>
        </li>
        <li className="flex justify-between items-center py-2">
          <span>Transportation</span>
          <span>$200 / $250</span>
        </li>
      </ul>
      <button className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Manage Budgets</button>
    </div>
  </div>
);


const HomePage: React.FC = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Welcome to Flowlet!</h1>
    <div className="bg-white p-4 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-semibold mb-2">Quick Actions</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Send Money</button>
        <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">Receive Money</button>
        <button className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded">View Cards</button>
        <button className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded">Analytics</button>
      </div>
    </div>
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-2">Recent Activity</h2>
      <ul>
        <li className="flex justify-between items-center py-2 border-b border-gray-200">
          <span>Coffee Shop</span>
          <span className="text-red-500">-$4.50</span>
        </li>
        <li className="flex justify-between items-center py-2 border-b border-gray-200">
          <span>Salary Deposit</span>
          <span className="text-green-500">+$2,000.00</span>
        </li>
        <li className="flex justify-between items-center py-2">
          <span>Online Purchase</span>
          <span className="text-red-500">-$75.00</span>
        </li>
      </ul>
    </div>
  </div>
);


const PaymentsPage: React.FC = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Payments</h1>
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-2">Choose a Payment Method</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-4 px-4 rounded text-lg">Bank Transfer</button>
        <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-4 px-4 rounded text-lg">Credit/Debit Card</button>
        <button className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-4 px-4 rounded text-lg">Mobile Wallet</button>
        <button className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-4 px-4 rounded text-lg">Cryptocurrency</button>
      </div>
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Scheduled Payments</h2>
        <p>No scheduled payments.</p>
        <button className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Schedule New Payment</button>
      </div>
    </div>
  </div>
);


const CompliancePage: React.FC = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Compliance</h1>
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-2">Regulatory Compliance</h2>
      <p className="mb-4">Ensuring adherence to all relevant financial regulations and standards.</p>
      <ul className="list-disc list-inside mb-6">
        <li>Anti-Money Laundering (AML)</li>
        <li>Know Your Customer (KYC)</li>
        <li>Data Protection Regulations (GDPR, CCPA)</li>
      </ul>
      <h2 className="text-xl font-semibold mb-2">Internal Policies</h2>
      <p className="mb-4">Our commitment to ethical practices and transparent operations.</p>
      <ul className="list-disc list-inside mb-6">
        <li>Privacy Policy</li>
        <li>Terms of Service</li>
        <li>Code of Conduct</li>
      </ul>
      <h2 className="text-xl font-semibold mb-2">Reporting & Audits</h2>
      <p className="mb-4">Access compliance reports and audit trails.</p>
      <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">View Reports</button>
    </div>
  </div>
);


const DeveloperPortalPage: React.FC = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Developer Portal</h1>
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-2">API Documentation</h2>
      <p className="mb-4">Access comprehensive documentation for our APIs.</p>
      <ul className="list-disc list-inside mb-6">
        <li>Payments API</li>
        <li>Wallet API</li>
        <li>Fraud Detection API</li>
      </ul>
      <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Explore APIs</button>

      <h2 className="text-xl font-semibold mt-6 mb-2">SDKs & Libraries</h2>
      <p className="mb-4">Integrate Flowlet easily with our SDKs for various platforms.</p>
      <ul className="list-disc list-inside mb-6">
        <li>Node.js SDK</li>
        <li>Python SDK</li>
        <li>Java SDK</li>
      </ul>
      <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">Download SDKs</button>

      <h2 className="text-xl font-semibold mt-6 mb-2">Developer Community</h2>
      <p className="mb-4">Join our community to get support and share ideas.</p>
      <ul className="list-disc list-inside mb-6">
        <li>Forum</li>
        <li>Stack Overflow</li>
        <li>GitHub</li>
      </ul>
      <button className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded">Join Community</button>
    </div>
  </div>
);

// Export all components
export {
  WalletScreen,
  TransactionHistory,
  SendMoney,
  ReceiveMoney,
  CardsScreen,
  CardDetails,
  IssueCard,
  AnalyticsScreen,
  ChatbotScreen,
  FraudAlerts,
  AIFraudDetectionScreen,
  SecurityScreen,
  SettingsScreen,
  EnhancedSecurityScreen,
  AdvancedBudgetingScreen,
  HomePage,
  PaymentsPage,
  CompliancePage,
  DeveloperPortalPage,
};

// Individual exports for direct imports
export default {
  WalletScreen,
  TransactionHistory,
  SendMoney,
  ReceiveMoney,
  CardsScreen,
  CardDetails,
  IssueCard,
  AnalyticsScreen,
  ChatbotScreen,
  FraudAlerts,
  AIFraudDetectionScreen,
  SecurityScreen,
  SettingsScreen,
  EnhancedSecurityScreen,
  AdvancedBudgetingScreen,
  HomePage,
  PaymentsPage,
  CompliancePage,
  DeveloperPortalPage,
};



