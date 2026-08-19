import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Experience from "./pages/Experience";
import WorkExcerpts from "./pages/WorkExcerpts";
import RoleDetail from "./pages/RoleDetail";
import Resume from "./pages/Resume";
import Projects from "./pages/Projects";
import ProjectsCompleted from "./pages/ProjectsCompleted";
import ProjectsInProgress from "./pages/ProjectsInProgress";
import ProjectsPlanned from "./pages/ProjectsPlanned";
import ProjectDetail from "./pages/ProjectDetail";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/about/contact" element={<Contact />} />
        <Route path="/experience" element={<Experience />} />
        <Route path="/experience/work-excerpts" element={<WorkExcerpts />} />
        <Route path="/experience/resume" element={<Resume />} />
        <Route path="/experience/:slug" element={<RoleDetail />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/completed" element={<ProjectsCompleted />} />
        <Route path="/projects/in-progress" element={<ProjectsInProgress />} />
        <Route path="/projects/planned" element={<ProjectsPlanned />} />
        <Route path="/projects/:slug" element={<ProjectDetail />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
