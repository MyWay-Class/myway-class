import type { CourseCard, CourseDetail, LectureDetail } from '@myway/shared';
import { ShortformWizard } from '../components/ShortformWizard';

type ShortformPageProps = {
  highlightedLecture: LectureDetail | null;
  selectedCourse: CourseDetail | null;
  courses: CourseCard[];
  sessionToken: string | null;
};

export function ShortformPage(props: ShortformPageProps) {
  return <ShortformWizard {...props} />;
}
