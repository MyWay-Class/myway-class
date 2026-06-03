import { useEffect, useMemo, useState } from 'react';
import type { AuthUser, CourseCard } from '@myway/shared';
import { loadAdminAssignment, saveAdminAssignment } from '../../../lib/api';
import { AdminAssignPageSections } from './AdminAssignPageSections';

type AdminAssignPageProps = {
  users: AuthUser[];
  courses: CourseCard[];
};

export function AdminAssignPage({ users, courses }: AdminAssignPageProps) {
  const students = users.filter((user) => user.role === 'STUDENT');
  const instructors = users.filter((user) => user.role === 'INSTRUCTOR');
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id ?? '');
  const [query, setQuery] = useState('');
  const [assignedStudentIds, setAssignedStudentIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedCourseId) ?? courses[0] ?? null,
    [courses, selectedCourseId],
  );

  const filteredStudents = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return students;
    }
    return students.filter((student) => {
      return [student.name, student.department, student.email].join(' ').toLowerCase().includes(normalized);
    });
  }, [query, students]);

  useEffect(() => {
    let mounted = true;
    if (!selectedCourse?.id) {
      setAssignedStudentIds([]);
      return () => {
        mounted = false;
      };
    }

    void loadAdminAssignment(selectedCourse.id).then((record) => {
      if (!mounted) {
        return;
      }
      setAssignedStudentIds(Array.isArray(record?.student_ids) ? record.student_ids : []);
    });

    return () => {
      mounted = false;
    };
  }, [selectedCourse?.id]);

  const assignedSet = useMemo(() => new Set(assignedStudentIds), [assignedStudentIds]);

  const toggleStudent = (studentId: string) => {
    setAssignedStudentIds((current) => {
      if (current.includes(studentId)) {
        return current.filter((id) => id !== studentId);
      }
      return [...current, studentId];
    });
  };

  const persistAssignment = async () => {
    if (!selectedCourse?.id || saving) {
      return;
    }
    setSaving(true);
    try {
      const saved = await saveAdminAssignment(selectedCourse.id, assignedStudentIds);
      if (saved) {
        setAssignedStudentIds(saved.student_ids ?? []);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminAssignPageSections
      selectedCourse={selectedCourse}
      courses={courses}
      query={query}
      instructorsCount={instructors.length}
      studentsCount={students.length}
      filteredStudents={filteredStudents}
      assignedStudentIds={assignedStudentIds}
      assignedSet={assignedSet}
      saving={saving}
      onSelectedCourseChange={setSelectedCourseId}
      onQueryChange={setQuery}
      onToggleStudent={toggleStudent}
      onPersistAssignment={persistAssignment}
      onResetSelection={() => setAssignedStudentIds([])}
    />
  );
}
