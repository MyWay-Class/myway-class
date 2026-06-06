import type { CourseCard } from '@myway/shared';
import { AdminAssignPageHero } from './AdminAssignPageHero';
import { AdminAssignPageInstructorSection } from './AdminAssignPageInstructorSection';
import { AdminAssignPageStudentSection } from './AdminAssignPageStudentSection';

type AdminAssignPageSectionsProps = {
  selectedCourse: CourseCard | null;
  courses: CourseCard[];
  query: string;
  instructorsCount: number;
  studentsCount: number;
  filteredStudents: Array<{ id: string; name: string; department: string }>;
  assignedStudentIds: string[];
  assignedSet: Set<string>;
  saving: boolean;
  onSelectedCourseChange: (courseId: string) => void;
  onQueryChange: (query: string) => void;
  onToggleStudent: (studentId: string) => void;
  onPersistAssignment: () => void;
  onResetSelection: () => void;
};

export function AdminAssignPageSections({
  selectedCourse,
  courses,
  query,
  instructorsCount,
  studentsCount,
  filteredStudents,
  assignedStudentIds,
  assignedSet,
  saving,
  onSelectedCourseChange,
  onQueryChange,
  onToggleStudent,
  onPersistAssignment,
  onResetSelection,
}: AdminAssignPageSectionsProps) {
  return (
    <div className="space-y-5">
      <AdminAssignPageHero />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <AdminAssignPageInstructorSection
          selectedCourse={selectedCourse}
          courses={courses}
          onSelectedCourseChange={onSelectedCourseChange}
        />
        <AdminAssignPageStudentSection
          query={query}
          instructorsCount={instructorsCount}
          studentsCount={studentsCount}
          filteredStudents={filteredStudents}
          assignedStudentIds={assignedStudentIds}
          assignedSet={assignedSet}
          saving={saving}
          onQueryChange={onQueryChange}
          onToggleStudent={onToggleStudent}
          onPersistAssignment={onPersistAssignment}
          onResetSelection={onResetSelection}
        />
      </div>
    </div>
  );
}

export { AdminAssignPageHero } from './AdminAssignPageHero';
export { AdminAssignPageInstructorSection } from './AdminAssignPageInstructorSection';
export { AdminAssignPageStudentSection } from './AdminAssignPageStudentSection';
