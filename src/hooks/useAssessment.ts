import { QueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { AssessmentClient } from '../services/staff/Assessments/assessmentClient';
import toast from 'react-hot-toast';

export const useAssessments = ({
	course,
	assessmentId,
}: {
	course?: string;
	assessmentId?: string;
}) => {
	const queryClient = new QueryClient();

	const getAllAssessments = useQuery({
		queryKey: ['allAssessments', JSON.stringify(course)],
		queryFn: () => AssessmentClient.getAllAssessments(course!),
		staleTime: 600000,
		enabled: Boolean(course) && Boolean(!assessmentId),
	});

	const getAssessment = useQuery({
		queryKey: ['getAssessment', assessmentId!],
		queryFn: () => AssessmentClient.getAssessment(assessmentId!),
		staleTime: 600000,
		enabled: Boolean(assessmentId) && Boolean(!course),
	});

	const getAssessmentAnalytics = useQuery({
		queryKey: ['getAssessmentAnalytics', assessmentId!],
		queryFn: () => AssessmentClient.getAssessmentAnalytics(assessmentId!),
		staleTime: 600000,
		enabled: Boolean(assessmentId) && Boolean(course),
	});

	const createAssessment = useMutation({
		mutationFn: (body: Assessments.CreateAssessmentPayload) =>
			AssessmentClient.createAssessment(body),
		onSuccess: () => {
			toast.success('Assessment has successfully Created...');
			queryClient.invalidateQueries(['allAssessments', JSON.stringify(course)] as any);
		},
		onError: (error) => {
			toast.error(
				error.message ?? 'Sorry, Failed to Create a Assessment, please try again',
			);
		},
	});

	const updateAssessment = useMutation({
		mutationFn: (payload: {
			levelId: string;
			body: Assessments.UpdateAssessmentLevelPayload;
		}) => AssessmentClient.updateAssessmentLevel(payload.levelId, payload.body),
		onSuccess: () => {
			toast.success('Assessment has successfully updated...');
			queryClient.invalidateQueries(['allAssessments', JSON.stringify(course)] as any);
		},
		onError: (error) => {
			toast.error(
				error.message ?? 'Sorry, Failed to Update a Assessment, please try again',
			);
		},
	});

	return {
		getAllAssessments,
		getAssessment,
		getAssessmentAnalytics,
		createAssessment,
		updateAssessment,
	};
};
