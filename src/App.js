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
		//Since this function waits, this value should be saved beofre it is overwritten.
		const tempTitle = taskTitle.current.value;

		//Check if task summary already filled, if not, fill it with GPT
		let tempSummary = taskSummary.current.value;
		if (taskSummary.current.value) {
			//console.log(taskSummary.current.value);
		} else { //Otherwise generate a tasklist
			tempSummary = await getGPTResponse(taskTitle.current.value);
			//console.log(`Summary has been set to: ${tempSummary}`);
		}

		setTasks([
			...tasks,
			{
				title: tempTitle,
				summary: tempSummary,
			},
		]);

		saveTasks([
			...tasks,
			{
				title: tempTitle,
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
				resolve(content);
			  })
			  .catch((error) => {
				console.log('ChatGPT request errored:', error.message);
				reject(error);
			  });
		  });
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
