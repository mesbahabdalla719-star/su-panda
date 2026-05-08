
# Su Panda - أشهى المأكولات للسكري

<p align="center">
  <img src="https://i.postimg.cc/c1vHwDHM/5413533022658694454.jpg" alt="Su Panda Logo" width="150">
</p>

<p align="center">
  <strong>An elegant and modern web application designed to help diabetics browse, choose, and order healthy and delicious meals.</strong>
</p>
<p align="center">
  تطبيق ويب أنيق وعصري مصمم لمساعدة مرضى السكري على تصفح واختيار وطلب وجبات صحية ولذيذة.
</p>

---

## ✨ Key Features | الميزات الرئيسية

- **🍽️ Multi-Category Menu:** Browse dishes across various categories like Breakfast, Lunch, Dinner, Snacks, and more.
- **🌐 Multi-Language Support:** Fully localized interface in English, Arabic (العربية), and Russian (Русский) with RTL support.
- **🛒 Shopping Cart:** Add dishes to a persistent shopping cart that syncs with your user account.
- **❤️ Favorites System:** Save your favorite dishes for quick access later.
- **🔐 User Authentication:** Secure sign-up and login functionality using Firebase Authentication (Email/Password).
- **📝 Order Placement:** A complete checkout process allowing users to place orders which are then stored in Firestore.
- **🛡️ Admin Dashboard:** A protected route for administrators to view all customer orders, see store analytics (revenue, order counts), and update order statuses.
- **🧮 Nutrition Calculator:** A tool for users to track their daily intake of protein, sugar, and calories.
- **🌓 Dark/Light Mode:** A beautiful and seamless theme switcher for user comfort.
- **📱 Fully Responsive Design:** A great user experience on all devices, from mobile phones to desktops.

---

## 🛠️ Tech Stack & Environment | بيئة العمل والتقنيات المستخدمة

This project is built with a modern and powerful tech stack to ensure performance, scalability, and a great developer experience.

- **Framework:** [**Next.js 15**](https://nextjs.org/) (with App Router)
- **Language:** [**TypeScript**](https://www.typescriptlang.org/)
- **Backend & Database:** [**Firebase**](https://firebase.google.com/)
  - **Authentication:** For user sign-up and login.
  - **Firestore:** As the NoSQL database for storing user data, orders, cart, etc.
  - **Security Rules:** To protect database access and define user/admin roles.
- **Styling:**
  - [**Tailwind CSS**](https://tailwindcss.com/): A utility-first CSS framework for rapid UI development.
  - [**ShadCN/UI**](https://ui.shadcn.com/): A collection of beautifully designed, accessible, and reusable components.
- **State Management:** [**React Context API**](https://react.dev/learn/passing-data-deeply-with-context) for managing global state (e.g., language, cart, auth).
- **Form Handling:** [**React Hook Form**](https://react-hook-form.com/) & [**Zod**](https://zod.dev/) for robust and type-safe form validation.
- **UI/UX:**
  - **Icons:** [Lucide React](https://lucide.dev/)
  - **Charts:** [Recharts](https://recharts.org/) for the admin dashboard analytics.

---

## 🚀 Deployment | النشر

For a detailed deployment guide, please see [docs/PUBLISHING_GUIDE.md](./docs/PUBLISHING_GUIDE.md).

### Deploy to Firebase (Recommended)
The project is already configured with `apphosting.yaml`. You can deploy it using the Firebase CLI:
```bash
firebase deploy
```

### Deploy to Vercel
1.  Push your code to a GitHub repository (already done in your case!).
2.  Import the project into [Vercel](https://vercel.com/).
3.  Add the environment variables listed in `.env.example` to the Vercel project settings.
4.  Vercel will automatically detect Next.js and deploy your application.
