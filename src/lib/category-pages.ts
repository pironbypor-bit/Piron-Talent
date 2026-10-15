/**
 * Page copy for the public category pages (/services/<category> and /services/<category>/<city>).
 * English text is the i18n key; Khmer is added in the final language pass.
 * Rules: no prices, no counts, no claims about licences. Regulated work says plainly that Piron Work does not verify licences.
 */
export type CategoryContent = {
  slug: string;
  /** Lower-case noun phrase used in sentences: "Find {people} in {city}". */
  people: string;
  lead: string;
  tasks: string[];
  prepare: string[];
  choose: string[];
  faqs: [string, string][];
  /** Shown above the providers when the work is regulated or carries safety risk. */
  caution?: string;
};

const LICENCE_FAQ: [string, string] = [
  "Does Piron Work check professional licences?",
  "No. We check identity and keep a record of completed jobs and reviews. Ask the provider for their licence or registration and keep a copy before you rely on the work.",
];

export const CATEGORY_CONTENT: CategoryContent[] = [
  {
    slug: "finance",
    people: "bookkeepers and accountants",
    lead: "Monthly books, receipts, invoices and simple reports for shops, small businesses and freelancers.",
    tasks: ["Monthly bookkeeping", "Sorting receipts and expenses", "Invoices and payment follow-up", "Simple profit and loss report", "Excel stock and sales sheets", "Preparing records for a tax agent"],
    prepare: ["Receipts, invoices and bank or wallet statements for the period", "The accounting tool or Excel file you already use, if any", "A rough count of your transactions in a normal month"],
    choose: ["Ask for a sample report or the template they use", "Agree what is included each month and the day you receive the books", "Share only the records needed, never your account passwords"],
    faqs: [
      ["How is the price set?", "The provider quotes after reading your task. Monthly bookkeeping can be priced by the number of transactions, so ask what is included."],
      ["Does a bookkeeper also file my tax?", "Not always. Bookkeeping and tax filing are different jobs. Post tax filing as its own task or choose a provider in Tax Agency."],
    ],
  },
  {
    slug: "documents",
    people: "administrative assistants and document specialists",
    lead: "Typing, forms, templates, data entry and filing, done by someone who handles paperwork every day.",
    tasks: ["Typing and formatting documents", "Khmer and English document drafting", "Data entry from paper or photos", "Contract and form templates", "Scanning and filing", "Excel and Word templates", "Meeting minutes"],
    prepare: ["The original files, photos or scans", "The format you need, such as Word, Excel or PDF", "Your deadline and how many pages or rows"],
    choose: ["Ask for a short sample on one page before the full job", "Agree how corrections are handled and how many rounds are included", "Send copies, and keep the originals yourself"],
    faqs: [
      ["Can I send documents with personal details?", "Share only what the task needs. Hide numbers and details that are not required, and agree with the provider that files are deleted after the job."],
      ["How long does a typical job take?", "It depends on the length and the quality of the originals. Ask for a delivery date in the quote."],
    ],
  },
  {
    slug: "legal",
    people: "legal advisers",
    lead: "Help reading and drafting contracts, company paperwork and general legal questions.",
    tasks: ["Reviewing a contract before you sign", "Drafting a simple agreement", "Company paperwork and registration support", "Employment contract templates", "Writing a formal notice letter", "Explaining a legal document in plain words"],
    prepare: ["The document or a clear description of the situation", "What outcome you want and by when", "Names of the people or companies involved"],
    choose: ["Ask whether they are a licensed lawyer or a document assistant", "Agree in writing what advice is included and what is not", "Keep a copy of everything you send and receive"],
    faqs: [
      LICENCE_FAQ,
      ["Is advice here the same as going to court?", "No. A provider here can help with documents and general questions. For a court case or a dispute that may end up in court, use a licensed lawyer."],
    ],
    caution: "Some legal work needs a licensed lawyer. Piron Work does not verify professional licences, so ask to see theirs before you rely on advice.",
  },
  {
    slug: "tax",
    people: "tax agents",
    lead: "Support with tax registration, monthly and annual filing, and preparing records for the tax authority.",
    tasks: ["Monthly tax filing support", "Annual tax filing support", "Tax registration paperwork", "Preparing records before filing", "Reading and answering a tax notice", "Checking that your papers are complete"],
    prepare: ["Your business registration papers", "Sales and expense records for the period", "Any earlier filings and notices you received"],
    choose: ["Ask which filings they handle and which they do not", "Agree who submits the filing and who keeps the receipt", "Confirm the deadline in the quote, not in a chat message"],
    faqs: [
      LICENCE_FAQ,
      ["Who is responsible for the filing?", "The business owner stays responsible. Agree clearly who prepares, who checks and who submits."],
    ],
    caution: "Tax work can carry penalties if it is wrong. Piron Work does not verify professional licences, so ask the provider for theirs before you start.",
  },
  {
    slug: "audit",
    people: "auditors and reviewers",
    lead: "Review of financial records, preparation for an audit and checks of internal controls.",
    tasks: ["Preparing records for an audit", "Reviewing annual financial statements", "Internal control review", "Stock count support", "Checking records against bank statements", "Writing a short findings report"],
    prepare: ["Financial statements and ledgers for the period", "Bank statements and supporting documents", "The reason for the review, such as a lender, investor or owner request"],
    choose: ["Ask what kind of report you will receive at the end", "Agree the scope and the people they may speak to in your team", "Confirm who may read the report once it is done"],
    faqs: [
      LICENCE_FAQ,
      ["Is this a statutory audit?", "A statutory audit has legal requirements about who may sign it. Ask the provider what their report is and who it can be shown to."],
    ],
    caution: "A formal audit opinion must come from a qualified auditor. Piron Work does not verify professional licences, so ask for proof before you rely on a report.",
  },
  {
    slug: "technology",
    people: "IT support and developers",
    lead: "Computer and network help, websites, page setup, spreadsheets that work for you and small software jobs.",
    tasks: ["Computer and network support", "A simple website or landing page", "Facebook page and Google listing setup", "Excel automation and forms", "Phone, printer or point-of-sale setup", "Data backup and recovery", "A small web or mobile app"],
    prepare: ["What is not working, or what you want it to do", "Photos or screenshots of the problem", "Which accounts or devices are involved"],
    choose: ["Ask how they will protect your accounts and data during the work", "Agree who owns the files, logins and domain at the end", "For a build, split the price into steps and check each step"],
    faqs: [
      ["Should I give my passwords?", "Avoid it. Add the provider as a user with limited access where the service allows it, and change passwords when the job ends."],
      ["Who owns the website or app after the job?", "Agree this before you start. Ask for the domain, hosting and files to be registered in your name."],
    ],
  },
  {
    slug: "creative",
    people: "designers, photographers and video editors",
    lead: "Logos, menus, posters, product photos and short videos for your shop, page or event.",
    tasks: ["Logo and brand colours", "Menu and poster design", "Product and food photos", "Short videos for TikTok and Facebook", "Page cover and post designs", "Packaging and label design", "Print-ready files"],
    prepare: ["Your logo, colours and any examples you like", "The size and where it will be used, such as print, Facebook or TikTok", "The text and photos that must appear"],
    choose: ["Look at their earlier work on their profile, not only the best piece", "Agree how many changes are included and what is delivered at the end", "Ask for the editable file as well as the final image, if you will need changes later"],
    faqs: [
      ["Who owns the design?", "Agree it in the quote. Many buyers ask for the right to use the design freely and to receive the editable file."],
      ["How do changes work?", "Ask how many rounds of changes the price includes. More rounds can be agreed and priced together."],
    ],
  },
  {
    slug: "electrical",
    people: "electricians",
    lead: "Wiring, lighting, faults and safety checks for a shop, room or small workplace.",
    tasks: ["Wiring a shop or room", "Finding and fixing a power fault", "Installing lights and fans", "Checking the distribution board", "Electrical connection for an air conditioner", "A safety check before opening"],
    prepare: ["Photos of the place and the problem", "The address and when someone can let the electrician in", "Whether the work needs the power turned off and for how long"],
    choose: ["Ask about earlier work of the same kind", "Agree materials, who buys them and what is guaranteed", "Do not accept work on a live board without proper safety steps"],
    faqs: [
      LICENCE_FAQ,
      ["Who pays for materials?", "Say it in the quote. Ask for a list with quantities, and whether the electrician or you buys them."],
    ],
    caution: "Electrical work can cause fire or injury if it is done wrong. Piron Work does not verify professional licences or experience, so ask what the provider has done before and keep a written quote.",
  },
  {
    slug: "maintenance",
    people: "repair and maintenance workers",
    lead: "Plumbing, painting, tiling, air conditioner service and repairs around the shop, office or home.",
    tasks: ["Fixing a leak or blocked pipe", "Painting a room or shopfront", "Air conditioner cleaning and service", "Door, furniture and shelf repair", "Tiling and small building repairs", "Regular maintenance visits for a shop"],
    prepare: ["Photos of what needs repair", "Measurements where they matter, such as walls or doors", "When the place is open and when work can be done"],
    choose: ["Ask for a visit or a photo check before the price is fixed", "Agree the materials and what happens if the problem comes back", "Pay a part now and the rest when you have checked the work"],
    faqs: [
      ["Do I pay before the work?", "Agree this in the quote. Many buyers pay a small part to start and the rest after they have checked the work."],
      ["What if the repair fails again?", "Ask for a short guarantee period in the quote, and what it covers."],
    ],
  },
  {
    slug: "beauty",
    people: "hair, makeup and beauty professionals",
    lead: "Hair, makeup, nails and styling for everyday, events and photo shoots.",
    tasks: ["Haircut and styling", "Makeup for an event", "Bridal makeup and hair", "Nails", "Styling for a photo shoot", "A visit to your home or workplace"],
    prepare: ["The date, time and place", "Photos of the style you want", "Allergies or skin sensitivity the provider should know about"],
    choose: ["Look at photos of earlier work and read the reviews", "Agree where the service takes place and who brings the products", "For events, agree the arrival time and what happens if there is a delay"],
    faqs: [
      ["Can the provider come to me?", "Many can. Say it in your post and ask whether travel is included in the price."],
      ["What about allergies?", "Tell the provider before you book. Ask which products they use and whether you may bring your own."],
    ],
  },
  {
    slug: "staffing",
    people: "temporary staff",
    lead: "Short-term helpers for events, shop cover, promotions and busy periods.",
    tasks: ["Event helpers", "Shop cover for a day", "Promotion and sampling staff", "Data entry team for a rush job", "Delivery helpers", "Short-term office assistant"],
    prepare: ["How many people, which days and what hours", "What the work is and what clothes or tools are needed", "Where it takes place and how people get there"],
    choose: ["Agree hours, pay and breaks in writing before the first day", "Ask who is responsible for each person and who to call if someone does not arrive", "Meet or call the person first for work that needs trust"],
    faqs: [
      ["Does Piron Work employ the staff?", "No. Providers are independent and you agree the terms directly with them."],
      ["What if someone does not show up?", "Ask for a plan in the quote, such as a replacement or a refund of the day. Tell us if a provider does not turn up."],
    ],
  },
  {
    slug: "education",
    people: "tutors and trainers",
    lead: "Lessons and training in languages, school subjects, computer skills and more.",
    tasks: ["English lessons", "Maths and science tutoring", "Computer skills such as Excel and Word", "Exam preparation", "Khmer reading and writing practice", "Training for your staff", "Music or art lessons"],
    prepare: ["The learner's age and level", "The goal, such as an exam, a job or daily conversation", "Days and hours that suit, and whether lessons are online or in person"],
    choose: ["Ask for a short first lesson or a trial", "Agree the length of each lesson, how many a week and what happens when one is missed", "Ask how progress will be shown, for example a short test or notes"],
    faqs: [
      ["Can lessons be online?", "Yes, if the provider offers it. Say it in your post and check that you have a stable connection."],
      ["Who provides the books?", "Say it in the quote. Ask whether materials are included or bought separately."],
    ],
  },
  {
    slug: "logistics",
    people: "delivery and logistics helpers",
    lead: "Deliveries, pickups, moving a shop or office, and regular runs for your business.",
    tasks: ["Same-day delivery in the city", "Moving a shop or office", "Pickup from a market or supplier", "Regular delivery runs", "Document courier", "Transport of heavy or bulky items"],
    prepare: ["Pickup and drop-off addresses and a contact number at each", "What is being moved, with size and weight", "The time window and whether the goods are fragile"],
    choose: ["Agree who is responsible for damage or loss before pickup", "Ask what vehicle will be used and whether there are extra charges for waiting or stairs", "For regular runs, agree a schedule and a way to confirm each delivery"],
    faqs: [
      ["Who pays if something is damaged?", "Agree it before pickup and write it in the quote. Take photos of the goods when they are handed over and when they arrive."],
      ["Can I track the delivery?", "Not in Piron Work. Ask the provider how they will confirm the pickup and the delivery."],
    ],
  },
];

export const categoryContent = (slug: string) => CATEGORY_CONTENT.find((c) => c.slug === slug) ?? null;
