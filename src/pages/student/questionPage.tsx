import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BsClockHistory } from 'react-icons/bs';
// import { BsArrowLeft, BsClockHistory } from 'react-icons/bs';
import { FaSpinner } from 'react-icons/fa';
import toast from 'react-hot-toast';
import LevelBar from '../../component/pageComponents/student/levelBar';
import { useStudents } from '../../hooks/user/students/useStudents';
import { parseJwt } from '../../utils/parseJWT';
import ResultSubmittedPage from '../../component/pageComponents/student/resultSubmittedPage';
import { Config } from '../../config';
import QuizReminderPopup from './reminderPopup';
import LevelsScorePage from '../../component/pageComponents/student/levelScorePage';
import { PrimaryButton } from '../../component/buttons/primaryButton';
import { BackArrow } from '../../assets/svg/backArrow';
const formatTime = (seconds: number): string => {
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = seconds % 60;
	return `${minutes.toString().padStart(2, '0')}:${remainingSeconds
		.toString()
		.padStart(2, '0')}`;
};

const QuestionPage = () => {
	const { testId } = useParams() as { testId: string };
	const { getTestById, getResultByLevel, CreateResponse, CreateAllLevelResponse } =
		useStudents();
	const [instruction, setInstruction] = useState(true);
	const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
	const [questionTimeRemaining, setQuestionTimeRemaining] = useState<number | null>(null);
	const [showPopup, setShowPopup] = useState<boolean>(false);
	const token = localStorage.getItem(Config.localStorageKeys.access_token);
	let studentId: any;

	if (token) {
		const decodedToken = parseJwt(token);
		studentId = decodedToken.sub;
	}
	const [showResult, setShowResult] = useState(false);
	console.log({ testId, studentId });
	const Test = getTestById(testId, studentId);
	const [timeTaken, setTimeTaken] = useState<string>('00:00');
	const [triggerSubmit, setTrigger] = useState(false);
	const [triggerSubmitForTotalTimer, setTriggerTotalTimer] = useState(false);
	const [startTime, setStartTime] = useState<Date | null>(null);
	const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [selectedOption, setSelectedOption] = useState<string | null>(null);
	const [tabSwitchCount, setTabSwitchCount] = useState(0);
	const [isTabFocused, setIsTabFocused] = useState(true);
	const [termsAccepted, setTermsAccepted] = useState(false);
	const [submittedPage, setSubmitted] = useState(false);
	const [textarea,setTextAreaValue] = useState("")

	const navigate = useNavigate();

	const currentLevel = Test.data?.levels[currentLevelIndex];
	const questions = currentLevel?.questions;
	const currentQuestion = questions?.[currentQuestionIndex];
	const currentLevelLength: any = Test?.data?.levels.length;

	const timerType = Test.data?.timerForWholeTest;
	const totalTestTime = 10000;
	const questionTime = currentQuestion?.timer.overAllSeconds;

	const levelResult = getResultByLevel((currentLevel as any)?.id, studentId);

	const isFirstRun = useRef(true);

	useEffect(() => {
		if (timerType === true && totalTestTime) {
			if (timeRemaining === 0) return;

			if (isFirstRun.current) {
				setTimeRemaining(totalTestTime);
				isFirstRun.current = false;
			}

			const testTimer = setInterval(() => {
				if (!showResult && !instruction && !Test.data?.completed) {
					setTimeRemaining((prevTime) => {
						if (prevTime && prevTime > 0) {
							return prevTime - 1;
						} else {
							setTriggerTotalTimer(true);
							return 0;
						}
					});
				}
			}, 1000);

			return () => clearInterval(testTimer);
		}
	}, [showResult, instruction, totalTestTime, timerType]);

	useEffect(() => {
		handleSubmitResponse();
	}, [triggerSubmitForTotalTimer, !Test.data?.completed]);

	useEffect(() => {
		if (timerType === false && questionTime) {
			setQuestionTimeRemaining(questionTime);

			const questionTimer = setInterval(() => {
				if (!showResult && !instruction) {
					setQuestionTimeRemaining((prevTime) => {
						if (prevTime && prevTime > 0) {
							return prevTime - 1;
						} else {
							// Time's up! Move to next question
							handleNext();
							setTrigger(true);
							return 0; // Set to zero to prevent further processing
						}
					});
				}
			}, 1000);

			return () => clearInterval(questionTimer);
		}
	}, [
		showResult,
		instruction,
		currentQuestionIndex,
		questionTime,
		triggerSubmit,
		timerType,
	]);

	useEffect(() => {
		const handleVisibilityChange = () => {
			if (document.visibilityState === 'visible') {
				setIsTabFocused(true);
			} else {
				setIsTabFocused(false);
				if (!showResult || !instruction) {
					setTabSwitchCount((prevCount) => prevCount + 1);
				}
				if (tabSwitchCount >= 2) {
					Test.data?.levels[currentLevelIndex].questions;
					handleSubmitResponse();
				}
			}
		};
		document.addEventListener('visibilitychange', handleVisibilityChange);
		return () => {
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
	}, [showResult != true, instruction != true, tabSwitchCount]);
	useEffect(() => {
		if (!showResult && !instruction && !isTabFocused && tabSwitchCount < 3) {
			setShowPopup(true);
			alert("'Don't forget to return to the quiz!");
			// Notify user when tab is not focused
			if (Notification.permission === 'granted') {
				new Notification('Reminder', {
					body: "Don't forget to return to the quiz!",
				});
			}
		}
	}, [isTabFocused, showResult != true, instruction != true]);

	const handleClosePopup = () => {
		setShowPopup(false);
	};

	const handleNext = () => {
		setTextAreaValue("")
		if (questions && currentQuestionIndex < questions.length - 1) {
			setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
		} else {
			handleSubmitResponse();
		}
		setSelectedOption(null);
	};
	const handleNextLevel = () => {
		if (currentLevelIndex < currentLevelLength - 1) {
			setCurrentLevelIndex((prevIndex) => prevIndex + 1);
			setCurrentQuestionIndex(0);
			setShowResult(false);
		}
	};

	const handleSubmitResponse = async () => {
		const responses: any[] =
			JSON.parse(
				localStorage.getItem(`test-${testId}-level-${currentLevelIndex}-responses`) ||
					'[]',
			) || [];
		const uniqueResponses = Array.from(
			new Map(
				responses.map((item: { questionId: any }) => [item.questionId, item]),
			).values(),
		);

		const levelQuestions = Test.data?.levels[currentLevelIndex]?.questions || [];
		const endTime = new Date();
		if (startTime) {
			const timeTakenInSeconds = Math.floor(
				(endTime.getTime() - startTime.getTime()) / 1000,
			);
			const answeredQuestions = new Set(
				responses.map((response: { questionId: any }) => response.questionId),
			);

			const formattedTimeTaken = formatTime(timeTakenInSeconds);

			setTimeTaken(formattedTimeTaken);

			const allResponses = levelQuestions.map((question) => {
				const selectedOption = answeredQuestions.has(question.id)
					? responses.find(
							(response: { questionId: string }) =>
								response.questionId === question.id,
						).selectedOption
					: '';

				return {
					questionId: question.id,
					selectedOption,
				};
			});
			// Function to get responses for all questions across levels
			const allLevelResponses = Test.data?.levels.flatMap((level: any) =>
				level.questions.map((question: any) => {
					const response = responses.find(
						(r: { questionId: string }) => r.questionId === question.id,
					);
					return {
						questionId: question.id,
						selectedOption: response?.selectedOption || '',
						levelId: level.id, // Include levelId in each response
					};
				}),
			);

			try {
				const processedResponses = uniqueResponses.map((response: any) => ({
					questionId: response.questionId,
					testId: testId,
					selectedOption: response.selectedOption,
				}));

				const res = triggerSubmitForTotalTimer
					? await CreateAllLevelResponse.mutateAsync({
							studentId: studentId,
							testId: testId,
							timeTaken: timeTakenInSeconds,
							responses: allLevelResponses as any,
						}).then(() => {
							alert('successfully submitted the responses');
							setSubmitted(true);
							toast.success('successfully submitted the responses');
							// navigate(`/result/${res.userMarksId}`);
						})
					: await CreateResponse.mutateAsync({
							levelId: (currentLevel as any)?.id,
							studentId: studentId,
							testId: testId,
							responses:
								tabSwitchCount >= 2 || triggerSubmit
									? (allResponses as any)
									: processedResponses,
							timeTaken: timeTakenInSeconds,
						});

				console.log(res);

				Test.refetch()
				// if(!res.create){
				//   console.log(1)
				//   alert(res.message)
				//   toast.error(res.message)
				// }
				setTrigger(false);
				if (!res.create) {
					setShowResult(true);
				}
				if (res.create) {
					alert('successfully submitted the responses');
					toast.success('successfully submitted the responses');
					setShowResult(true);
				}
				localStorage.removeItem(`test-${testId}-level-${currentLevelIndex}-responses`);
				if (
					res.update &&
					currentLevelIndex === (Test as any).data?.levels?.length - 1
				) {
					alert('successfully submitted the responses');
					toast.success('successfully submitted the responses');
					setSubmitted(true);
					// navigate(`/result/${res.updatedUserMarks.id}`);
				}
			} catch (error) {
				setTrigger(false);
				console.error('Error submitting responses:', error);
			}
		}
	};

	const handleTextareaChange = (value: string, currentQuestionId: string) => {

		setTextAreaValue(value)
		const levelKey = `test-${testId}-level-${currentLevelIndex}-responses`;
		const responses = JSON.parse(localStorage.getItem(levelKey) || '[]');

		const existingResponseIndex = responses.findIndex(
			(response: { questionId: string }) => response.questionId === currentQuestionId,
		);

		if (existingResponseIndex !== -1) {
			// Update existing response
			responses[existingResponseIndex].selectedOption = value;
		} else {
			// Add new response if it doesn't exist
			responses.push({ questionId: currentQuestionId, selectedOption: value });
		}

		localStorage.setItem(levelKey, JSON.stringify(responses));
		setSelectedOption(value);
		
	};

	const handleOptionSelect = (option: string, questionId: string) => {
		setSelectedOption(option);
		setTimeout(handleNext, 500);

		const levelKey = `test-${testId}-level-${currentLevelIndex}-responses`;
		const responses = JSON.parse(localStorage.getItem(levelKey) || '[]');

		const existingResponseIndex = responses.findIndex(
			(response: { questionId: string }) => response.questionId === questionId,
		);

		if (existingResponseIndex !== -1) {
			// Update existing response
			responses[existingResponseIndex].selectedOption = option;
		} else {
			// Add new response if it doesn't exist
			responses.push({ questionId: questionId, selectedOption: option });
		}

		localStorage.setItem(levelKey, JSON.stringify(responses));
	};

	if (!Test.data) return <div>Loading...</div>;

	if (submittedPage || (Test as any).data?.completed) {
		return (
			<ResultSubmittedPage
				onClick={() => {
					window.open(
						`${Config.environment.APP_URL}/result/${(Test as any).data?.userMarks[0].id}`,
					);
				}}
				testName={Test.data.name}
				submissionTime={formatTime(parseInt(timeTaken))}
			/>
		);
	}

	if (instruction)
		return (
			<div className="w-full flex flex-col items-center lg:flex-row gap-2 h-full">
				<div className="w-full h-[40%] md:h-[35%] lg:h-full lg:bg-gradient-to-br from-teal-600/60 via-teal-600/20 to-teal-600/60 lg:w-[40%] flex justify-center flex-col items-center">
					<img
						alt=""
						className="h-full lg:h-[50%]"
						src="https://i.ibb.co/ZJmJVnj/Instruction-manual-rafiki-2.png"
					/>
				</div>
				<div className="w-full h-[60%] lg:w-[60%] flex flex-col gap-3 lg:justify-center md:px-10 px-5">
					<div className="flex flex-col gap-2 md:px-5">
						<p className="text-2xl md:text-3xl font-bold text-teal-700 text-left">
							Class Assessment Instructions
						</p>
						<p className="text-gray-600 text-left text-sm md:text-base">
							Welcome to the {Test.data.name} Test Assessment. This assessment
							consists of {Test.data.levelsCount} levels that progressively
							evaluate your understanding of the material. Please ensure you read
							all instructions before beginning.
						</p>
					</div>
					<div className="flex flex-col gap-2 md:px-5">
						<p className="text-lg md:text-xl font-semibold text-teal-700 mb-2 text-left">
							General Information
						</p>
						<p className="text-gray-600 mb-6 text-left text-sm md:text-base">
							You will have {Test.data.duration.hours} hour to complete all
							levels of the assessment. Time for each level will vary, and the
							timer will not stop between levels.
						</p>
						<p className="text-gray-600 mb-6 flex flex-col text-left text-sm md:text-base">
							{Test.data.levels.map((le, index) => (
								<span key={index}>
									{le.levelNo}. {le.levelName}
								</span>
							))}
						</p>
					</div>
					<div className="flex md:px-5">
						<input
							type="checkbox"
							id="terms"
							className="mr-2 accent-teal-600 hover:cursor-pointer"
							checked={termsAccepted}
							onChange={(e) => setTermsAccepted(e.target.checked)}
						/>
						<label htmlFor="terms" className="text-gray-600 text-sm md:text-base">
							I agree to the rules and conditions.
						</label>
					</div>

					<div className="flex justify-center md:justify-end w-full md:px-5">
						<PrimaryButton
							text="Get Started"
							disabled={!termsAccepted}
							className="w-[80%] md:w-[20%]"
							onClick={() => {
								setStartTime(new Date());
								setInstruction(false);
							}}
						/>
					</div>
				</div>
			</div>

			// <div className="justify-center flex flex-col h-[80vh] items-center text-center">
			//   {Test.data.instructions}{' '}
			//   <button className="bg-blue-500 py-2 px-6 rounded-lg" onClick={() => setInstruction(false)}>
			//     Start
			//   </button>
			// </div>
		);

	if (Test.data.completedLevelIndexes.includes(currentLevelIndex) || showResult) {
		return (
			// <div className="justify-center flex flex-col h-[80vh] items-center text-center">
			// 	<h2 className="text-2xl font-bold mb-4">
			// 		Level {currentLevelIndex + 1} Results
			// 	</h2>
			// 	<p className="text-lg">You mark is {levelResult.data?.score} .</p>
			// 	<span>
			// 		{levelResult.data?.level.Response.map((res) => {
			// 			return (
			// 				<div
			// 					className={`bg-${res.isCorrect ? 'green-300' : 'bg-red-300'}`}
			// 				>
			// 					<span className="flex gap-7">
			// 						your Answer:
			// 						{res.selectedOption}
			// 					</span>
			// 					<span className="flex gap-2">
			// 						correctAnswer {res.question.answer}
			// 					</span>
			// 				</div>
			// 			);
			// 		})}
			// 	</span>
			// 	<button
			// 		className="bg-blue-500 py-2 px-6 rounded-lg mt-4"
			// 		onClick={handleNextLevel}
			// 		disabled={currentLevelIndex >= currentLevelLength - 1}
			// 	>
			// 		{currentLevelIndex < currentLevelLength - 1 ? 'Next Level' : 'Finish'}
			// 	</button>
			// </div>
			<LevelsScorePage
				isLoading={levelResult.isLoading}
				onClick={handleNextLevel}
				score={(levelResult as any).data?.score}
				totalQuestions={(levelResult as any).data?.totalQuestions}
				pass={(levelResult as any).data?.pass}
				percentage={(levelResult as any).data?.percentage}
				level={(levelResult as any).data?.level}
			/>
		);
	}

	return (
		<div className="justify-center items-center w-full h-full bg-white flex flex-col ">
			<div className=" items-center w-full h-[90%] flex flex-col">
				{' '}
				<div className="flex justify-between items-center px-5 md:px-9 py-3 w-full cursor-pointer">
					<span
						className="flex gap-3 font-bold items-center"
						onClick={() => navigate('/student-dashboard?tab=assessment')}
					>
						<div
							className="px-2 py-2 border border-gray-500 rounded-lg hover:cursor-pointer hover:bg-gray-300"
							onClick={() => navigate(-1)}
						>
							<BackArrow />
						</div>
						<p className="text-xl">{Test.data.name}</p>
					</span>
					<span className="flex gap-2 items-center">
						{timerType === true && timeRemaining !== null && (
							<div className="font-bold flex  items-center justify-center  gap-2 ">
								<BsClockHistory className="h-6 w-6" />
								Time Remaining (Test): {Math.floor(timeRemaining / 60)}:
								{timeRemaining % 60 < 10 ? '0' : ''}
								{timeRemaining % 60}
							</div>
						)}

						{timerType === false && questionTimeRemaining !== null && (
							<div className=" font-bold ">
								Time Remaining (Question):{' '}
								{Math.floor(questionTimeRemaining / 60)}:
								{questionTimeRemaining % 60 < 10 ? '0' : ''}
								{questionTimeRemaining % 60}
							</div>
						)}
					</span>
				</div>
				<div className="w-full bg-teal-600/30 flex px-5 gap-5 md:gap-10 lg:px-24 py-4 lg:gap-24 items-center">
					<span className=" font-bold text-lg items-start">
						{currentLevelIndex + 1}. {currentLevel?.levelName}
					</span>
					<LevelBar
						totalLevels={Test.data.levels.length}
						activeLevel={currentLevelIndex}
						completedLevels={Test.data.completedLevelIndexes}
					/>
				</div>
				{currentQuestion && (
					<div className="w-full h-full flex justify-center items-center p-5">
						<div className=" rounded-lg p-4 w-full lg:w-[60%] gap-3">
							<h2 className="text-lg font-bold mb-2">
								{currentQuestionIndex + 1}. {currentQuestion.question}
							</h2>
							{currentQuestion.type === 'TEXTAREA' ? (
								<textarea
									className={`border transition-all duration-200 resize-none min-h-[200px] max-h-[200px] w-full px-3 py-4 rounded-lg outline-none focus:border-primary`}
									value={textarea}
									onChange={(e) =>
										handleTextareaChange(
											e.target.value,
											currentQuestion.id,
										)
									}
								/>
							) : (
								<div className=" rounded-lg p-2 grid grid-cols-2 gap-2">
									{currentQuestion.options.map((option, index: number) => {
										return (
											<div key={index} className="my-2">
												<label
													htmlFor={`option-${index}`}
													className={`flex items-center p-1 border rounded-lg cursor-pointer transition-all 
													${
														selectedOption === option.value
															? ' text-teal-600/30 bg-teal-600/10 border-teal-600/30'
															: 'bg-white border-gray-300 text-black hover:bg-gray-100'
													}`}
												>
													<input
														type="radio"
														id={`option-${index}`}
														name="option"
														value={option.value}
														checked={
															selectedOption === option.value
														}
														onChange={() =>
															handleOptionSelect(
																option.value,
																currentQuestion.id,
															)
														}
														className="hidden"
													/>
													<span className="font-bold border rounded-md bg-teal-600/30  py-2 px-3">
														{String.fromCharCode(65 + index)}
													</span>
													<span className="ml-2">
														{option.value}
													</span>
												</label>
											</div>
										);
									})}
								</div>
							)}
						</div>
					</div>
				)}
			</div>
			<div className="w-full h-[10%] flex justify-end items-center px-5 bg-teal-600/30">
				<PrimaryButton
					text={
						currentQuestionIndex === (questions as any)?.length - 1
							? 'Finish Level'
							: 'Next'
					}
					icon={
						CreateResponse.isPending ? (
							<FaSpinner className="animate-spin mr-2" />
						) : null
					}
					className="w-[40%] md:w-[30%] lg:w-[15%] md:text-xl"
					onClick={handleNext}
				/>
			</div>
			<QuizReminderPopup showPopup={showPopup} onClose={handleClosePopup} />
		</div>
	);
};

export default QuestionPage;