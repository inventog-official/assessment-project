import { HashRouter, Route, Routes } from 'react-router-dom';
import { AppLayout } from '../component/layouts/appLayout';
import { AuthLayout } from '../component/layouts/authLayout';
import { insecureRoutes } from './insecureRoutes';
import StaffDashboard from '../pages/admin/dashboard';
import StudentDashboard from '../pages/student/dashboard';
import AssessmentDetails from '../component/assessment/assessmentDetails';
import CoursesPage from '../pages/admin/coursesPage';
import CreateTestPage from '../pages/admin/createTest';
import AssessmentCreateModal from '../component/assessment/assessmentCreateModal';
import QuestionPage from '../pages/student/questionPage';
import ResultPage from '../pages/student/ResultPage';

export const AppRouter = () => {
	return (
		<HashRouter>
			<Routes>
				{/* App Layout */}
				<Route path="/" element={<AppLayout />}>
					{/* Public or insecure routes */}
					{insecureRoutes.map((route, index) => (
						<Route key={index} path={route.path} element={route.element} />
					))}

					{/* Auth Layout and protected routes */}
					<Route element={<AuthLayout />}>
						{/* Define your routes */}
						<Route path="staff-dashboard/courses" element={<CoursesPage />} />
						<Route path="staff-dashboard/:dept" element={<StaffDashboard />} />
						<Route
							path="create-assessment/:dept"
							element={<AssessmentCreateModal />}
						/>
						<Route
							path="staff-dashboard/:dept/:assessmentId/create-level"
							element={<CreateTestPage />}
						/>
						<Route
							path="assessment-analytics/:assessmentId"
							element={<AssessmentDetails />}
						/>
						<Route path="student-dashboard" element={<StudentDashboard />} />
						<Route path="question/:testId" element={<QuestionPage />} />
						<Route path="result/:userMarksId" element={<ResultPage />} />
					</Route>
				</Route>
			</Routes>
		</HashRouter>
	);
};

// export const router = createBrowserRouter([
// 	{
// 		path: '/',
// 		element: <AppLayout />,
// 		children: [
// 			...insecureRoutes,
// 			{
// 				path: '',
// 				element: <AuthLayout />,
// 				children: [
// 					{
// 						path: 'staff-dashboard/courses',
// 						element: <CoursesPage />,
// 					},
// 					{
// 						path: 'staff-dashboard/:dept',
// 						element: <StaffDashboard />,
// 					},
// 					{
// 						path: 'create-assessment/:dept',
// 						element: <AssessmentCreateModal />,
// 					},
// 					{
// 						path: 'staff-dashboard/:dept/:assessmentId/create-level',
// 						element: <CreateTestPage />,
// 					},
// 					{
// 						path: 'assessment-analytics/:assessmentId',
// 						element: <AssessmentDetails />,
// 					},
// 					{
// 						path: 'student-dashboard',
// 						element: <StudentDashboard />,
// 					},
// 					{
// 						path: 'question/:testId',
// 						element: <QuestionPage />,
// 					},
// 					{
// 						path: '/result/:userMarksId',
// 						element: <ResultPage />,
// 					},
// 				],
// 			},
// 		],
// 	},
// ]);
