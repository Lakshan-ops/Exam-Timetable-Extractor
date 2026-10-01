import "./globals.css";
import { currentUser } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";

export const metadata = {
  title: "Exam Timetable Extractor",
  description: "Find only your own exams in the university exam timetable",
};

export default async function RootLayout({ children }) {
  const user = await currentUser();
  return (
    <html lang="en">
      <body>
        <header>
          <strong>Exam Timetable Extractor</strong>
          {user && (
            <span>
              {user.username} <LogoutButton />
            </span>
          )}
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
