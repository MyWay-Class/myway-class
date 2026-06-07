import { expect, test } from '@playwright/test';

test('demo student can login, open my courses, and reach lecture watch page', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: /로그인|시작하기/ }).first().click();
  await page.locator('button', { hasText: '수강생' }).first().click();

  const myCoursesButton = page.getByRole('button', { name: /내 강의/ }).first();
  await expect(myCoursesButton).toBeVisible();
  await myCoursesButton.click();

  await expect(page.getByText(/수강 중인 강의|선택 강의 미리보기/).first()).toBeVisible();
  await page.getByRole('button', { name: '차시 시청으로 이동' }).first().click();

  await expect(page.getByText('영상 시청').first()).toBeVisible();
  await expect(page.getByText(/현재 차시|재생 가능한 영상이 없습니다./).first()).toBeVisible();
});
