/** External URLs for graph node action panel (recruiting, profiles, learning). */

const enc = encodeURIComponent;

export type ActionNodeGroup = "user" | "skill" | "job" | "gap";

export function profileQuickLinks(displayName: string) {
  const q = displayName.trim() || "developer";
  return [
    { label: "LinkedIn — people search", href: `https://www.linkedin.com/search/results/people/?keywords=${enc(q)}` },
    { label: "GitHub — user search", href: `https://github.com/search?q=${enc(q)}&type=users` },
    { label: "HackerRank", href: "https://www.hackerrank.com/dashboard" },
    { label: "LeetCode", href: "https://leetcode.com/" },
    { label: "Wellfound (AngelList)", href: `https://wellfound.com/role/l/jobs?keywords=${enc(q)}` },
  ];
}

export function recruitingLinks(jobTitle: string) {
  const t = jobTitle.trim() || "Software Engineer";
  return [
    { label: "LinkedIn Jobs", href: `https://www.linkedin.com/jobs/search/?keywords=${enc(t)}` },
    { label: "Indeed", href: `https://www.indeed.com/jobs?q=${enc(t)}` },
    { label: "Glassdoor", href: `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${enc(t)}` },
    { label: "Wellfound", href: `https://wellfound.com/role/r?q=${enc(t)}` },
    { label: "Remote OK", href: `https://remoteok.com/remote-dev-jobs` },
  ];
}

export function skillDocsLinks(skillName: string) {
  const s = skillName.trim() || "JavaScript";
  return [
    { label: "MDN Web Docs — search", href: `https://developer.mozilla.org/en-US/search?q=${enc(s)}` },
    { label: "devdocs.io", href: `https://devdocs.io/#q=${enc(s)}` },
    { label: "YouTube — tutorials", href: `https://www.youtube.com/results?search_query=${enc(s + " tutorial course")}` },
  ];
}

export function paidLearningLinks(skillName: string) {
  const s = skillName.trim() || "Python";
  return [
    { label: "Udemy — courses", href: `https://www.udemy.com/courses/search/?q=${enc(s)}` },
    { label: "Coursera", href: `https://www.coursera.org/search?query=${enc(s)}` },
    { label: "Pluralsight", href: `https://www.pluralsight.com/search?q=${enc(s)}` },
    { label: "LinkedIn Learning", href: `https://www.linkedin.com/learning/search?keywords=${enc(s)}` },
  ];
}

export function freeLearningLinks(skillName: string) {
  const s = skillName.trim() || "Python";
  return [
    { label: "GeeksforGeeks — search", href: `https://www.geeksforgeeks.org/search/?q=${enc(s)}` },
    { label: "freeCodeCamp — news / guides", href: `https://www.freecodecamp.org/news/?s=${enc(s)}` },
    {
      label: "YouTube — popular free courses (search)",
      href: `https://www.youtube.com/results?search_query=${enc(s + " full course tutorial")}`,
    },
    {
      label: "YouTube — freeCodeCamp channel",
      href: `https://www.youtube.com/@freecodecamp/search?query=${enc(s)}`,
    },
  ];
}
