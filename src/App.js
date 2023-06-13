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

//Fix user-agent issue
const setRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
XMLHttpRequest.prototype.setRequestHeader = function newSetRequestHeader(key, val) {
    if (key.toLocaleLowerCase() === 'user-agent') {
        return;
    }
    setRequestHeader.apply(this, [key, val]);
};


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

	async function createTask() {
		const tempTitle = taskTitle.current.value;
		//Check if task summary already filled
		let tempSummary = taskSummary.current.value;
		if (taskSummary.current.value) {
			console.log(taskSummary.current.value);
		} else { //Otherwise generate a summary
			console.log('No task summary');
			tempSummary = await getGPTResponse(taskTitle.current.value);
			console.log(`Summary has been set to: ${tempSummary}`);
		}

		setTasks([
			...tasks,
			{
				title: tempTitle,
				//summary: taskSummary.current.value,
				// summary: 'My summary test',
				summary: tempSummary,
			},
		]);

		saveTasks([
			...tasks,
			{
				title: tempTitle,
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
	async function getGPTResponse(task_title) {
		// return `Test GPT Response\n
		// 		1. step 1\n
		// 		2. step 2\n
		// 		3. step 3`;

		const pre_prompt = `Title: Clean room\n
							Steps: 1. Pick up trash\n2. Dust\n3. Move funiture\n4. Vacuum\n5. Polish furniture\n
							Title: Take out the trash\n
							Steps: 1. Take bag from trash can\n2. Tie trash bag\n3. Replace with new trash bag\n4. Put trash bag in outside bin\n
							Title: `;
		const post_prompt = 'Steps: ';
		const prompt = `${pre_prompt}${task_title}\n
						${post_prompt}`;
		
		return new Promise((resolve, reject) => {
			tectalicOpenai(process.env.REACT_APP_OPENAI_API_KEY)
			  .chatCompletions.create({
				model: 'gpt-3.5-turbo',
				max_tokens: 256,
				messages: [{ role: 'user', content: prompt }],
			  })
			  .then((response) => {
				const content = response.data.choices[0].message.content.trim();
				console.log(content);
				resolve(content);
			  })
			  .catch((error) => {
				console.log('ChatGPT request errored:', error.message);
				reject(error);
			  });
		  });


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
											<Text color={'dimmed'} size={'md'} mt={'sm'} style={{ whiteSpace: 'pre-line' }}>
											{task.summary ? task.summary : 'No Summary'}
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
