import {
	Button,
	Container,
	Text,
	Title,
	Modal,
	TextInput,
	Group,
	Card,
	ActionIcon,
	Code,
} from '@mantine/core';
import { useState, useRef, useEffect } from 'react';
import { MoonStars, Sun, Trash } from 'tabler-icons-react';

import {
	MantineProvider,
	ColorSchemeProvider,
	ColorScheme,
} from '@mantine/core';
import { useColorScheme } from '@mantine/hooks';
import { useHotkeys, useLocalStorage } from '@mantine/hooks';

//Set up for OpenAI API
const tectalicOpenai = require('@tectalic/openai').default;

export default function App() {
	const [tasks, setTasks] = useState([]);
	const [opened, setOpened] = useState(false);

	const preferredColorScheme = useColorScheme();
	const [colorScheme, setColorScheme] = useLocalStorage({
		key: 'mantine-color-scheme',
		defaultValue: 'light',
		getInitialValueInEffect: true,
	});
	const toggleColorScheme = value =>
		setColorScheme(value || (colorScheme === 'dark' ? 'light' : 'dark'));

	useHotkeys([['mod+J', () => toggleColorScheme()]]);

	const taskTitle = useRef('');
	const taskSummary = useRef('');

	function createTask() {
		//Check if task summary already filled
		let tempSummary = taskSummary.current.value;
		if (taskSummary.current.value) {
			console.log(taskSummary.current.value);
		} else { //Otherwise generate a summary
			console.log('No task summary');
			tempSummary = getGPTResponse(taskTitle.current.value);
		}

		setTasks([
			...tasks,
			{
				title: taskTitle.current.value,
				//summary: taskSummary.current.value,
				// summary: 'My summary test',
				summary: tempSummary,
			},
		]);

		saveTasks([
			...tasks,
			{
				title: taskTitle.current.value,
				// summary: taskSummary.current.value,
				summary: tempSummary,
			},
		]);
	}

	function deleteTask(index) {
		var clonedTasks = [...tasks];

		clonedTasks.splice(index, 1);

		setTasks(clonedTasks);

		saveTasks([...clonedTasks]);
	}

	function loadTasks() {
		let loadedTasks = localStorage.getItem('tasks');

		let tasks = JSON.parse(loadedTasks);

		if (tasks) {
			setTasks(tasks);
		}
	}

	function saveTasks(tasks) {
		localStorage.setItem('tasks', JSON.stringify(tasks));
	}

	// Get GPT response
	function getGPTResponse(task_title) {
		// return 'Test GPT Response';

		// const openaiClient = tectalicOpenai(process.env.OPENAI_API_KEY);
		// console.log(process.env.OPENAI_API_KEY);
		// const openaiClient = tectalicOpenai(apiKey);

		const pre_prompt = '(I am the pre prompt)';
		const post_prompt = '(I am the post prompt)';
		const prompt = `${pre_prompt}: ${task_title}\n
						${post_prompt}: `;

		try {
			tectalicOpenai(config.OPENAI_API_KEY)
			.chatCompletions.create({
				model: 'text-davinci-003',
				messages: [{ role: 'user', content: prompt }]
			})
			.then((response) => {
				return response.data.choices[0].message.content.trim();
			});
		} catch (error) {
			console.log('ChatGPT request errored.')
		}
		
		console.log('After expected response');
		
		// try {
		// 	const response = await openai.createCompletion({
		// 		model: "text-davinci-003",
		// 		prompt: `${pre_prompt}: task_title\n
		// 				${post_prompt}: `,
		// 		max_tokens:4000
		// 		});

		// 	return response.data.choices[0].text;
		//   } catch(error) {
		// 	console.error(error);
		// 	alert(error.message);
		//   }
	}

	useEffect(() => {
		loadTasks();
	}, []);

	return (
		<ColorSchemeProvider
			colorScheme={colorScheme}
			toggleColorScheme={toggleColorScheme}>
			<MantineProvider
				theme={{ colorScheme, defaultRadius: 'md' }}
				withGlobalStyles
				withNormalizeCSS>
				<div className='App'>
					<Modal
						opened={opened}
						size={'md'}
						title={'New Task'}
						withCloseButton={false}
						onClose={() => {
							setOpened(false);
						}}
						centered>
						<TextInput
							mt={'md'}
							ref={taskTitle}
							placeholder={'Task Title'}
							required
							label={'Title'}
						/>
						<TextInput
							ref={taskSummary}
							mt={'md'}
							placeholder={'Task Summary'}
							label={'Summary'}
						/>
						<Group mt={'md'} position={'apart'}>
							<Button
								onClick={() => {
									setOpened(false);
								}}
								variant={'subtle'}>
								Cancel
							</Button>
							<Button
								onClick={() => {
									createTask();
									setOpened(false);
								}}>
								Create Task
							</Button>
						</Group>
					</Modal>
					<Container size={550} my={40}>
						<Group position={'apart'}>
							<Title
								sx={theme => ({
									fontFamily: `Greycliff CF, ${theme.fontFamily}`,
									fontWeight: 900,
								})}>
								My Tasks
							</Title>
							<ActionIcon
								color={'blue'}
								onClick={() => toggleColorScheme()}
								size='lg'>
								{colorScheme === 'dark' ? (
									<Sun size={16} />
								) : (
									<MoonStars size={16} />
								)}
							</ActionIcon>
						</Group>
						{tasks.length > 0 ? (
							tasks.map((task, index) => {
								if (task.title) {
									return (
										<Card withBorder key={index} mt={'sm'}>
											<Group position={'apart'}>
												<Text weight={'bold'}>{task.title}</Text>
												<ActionIcon
													onClick={() => {
														deleteTask(index);
													}}
													color={'red'}
													variant={'transparent'}>
													<Trash />
												</ActionIcon>
											</Group>
											<Text color={'dimmed'} size={'md'} mt={'sm'}>
												{task.summary
													? task.summary
													: 'No Summary'}
											</Text>
										</Card>
									);
								}
							})
						) : (
							<Text size={'lg'} mt={'md'} color={'dimmed'}>
								You have no tasks
							</Text>
						)}
						<Button
							onClick={() => {
								setOpened(true);
							}}
							fullWidth
							mt={'md'}>
							New Task
						</Button>
					</Container>
				</div>
			</MantineProvider>
		</ColorSchemeProvider>
	);
}
