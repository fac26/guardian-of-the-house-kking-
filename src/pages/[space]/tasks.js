//localhost:3000/tasks
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import { useUser } from '@supabase/auth-helpers-react'

import { useRouter } from 'next/router'
import ListOfTasks from 'components/tasks/ListOfTasks'
import Layout from 'components/Layout'
import AddTaskForm from 'components/tasks/AddTaskForm'
import { useState, useEffect } from 'react'

function Tasks() {
	const user = useUser()
	const supabase = useSupabaseClient()
	const router = useRouter()
	const pathArr = router.asPath.split('/')

	const session = useSession()

	const [members, setMembers] = useState('')
	const [tasks, setTasks] = useState('')

	useEffect(() => {
		// getSpaceMembers()
		getTasksBySpaceId(pathArr[1])
		getMembersBySpaceId(pathArr[1])
		//getSpaceTasks()
		if (!session) {
			router.push('/')
		}
	}, [session, pathArr[1]])

	const getTasksBySpaceId = async (spaceId) => {
		const { data, error } = await supabase
			.from('tasks')
			.select('*')
			.eq('space_id', spaceId)

		if (error) {
			console.error(error)
			return
		}

		setTasks(data)
	}

	const getMembersBySpaceId = async (spaceId) => {
		const { data, error } = await supabase
			.from('space_members')
			.select('id, member_email')
			.eq('space_id', spaceId)

		if (error) {
			console.error(error)
			return
		}
		setMembers(data)
	}
	const addTaskHandler = async (task) => {
		const newTask = {
			name: task.taskName,
			description: task.taskDescription,
			space_id: pathArr[1],
			task_points: task.taskPoints,
			current_user_id: user.id
		}

		try {
			const spacesResponse = await supabase
				.from('tasks')
				.insert([newTask])
				.select()

			setTasks((prevState) => [...prevState, spacesResponse.data[0]])
			getTasksBySpaceId(pathArr[1]) // <-- Update tasks state after adding new task
		} catch (error) {
			console.error(error)
		}
	}
	const assignMembersHanler = async (assignedTask) => {
		// {assignMembers: {…}, taskId: 58}
		// assignMembers
		// :
		// {space_member.id: 62: rotation_week:'3', 110: '1', 111: '2'}
		// taskId
		// :
		// 58

		const taskId = assignedTask.taskId

		//[[id, position],[]]
		const assignments = Object.entries(assignedTask.assignMembers)
		const assignedMembersArray = assignments.map(
			([memberId, rotationPosition]) => ({
				task_id: taskId,
				member_id: memberId,
				rotation_position: rotationPosition
			})
		)
		console.log(assignedMembersArray)
		const { data, error } = await supabase
			.from('rotation')
			.insert(assignedMembersArray)
			.select('*')
		console.log(data)
		//rotation table if(task_id is in and member_id is in) should update and do not insert a new row
	}

	return (
		<>
			<Layout id={pathArr[1]}>
				<button>AddTask</button>
				<AddTaskForm onAddTask={addTaskHandler} />
				<ListOfTasks
					tasks={tasks}
					members={members}
					onAssign={assignMembersHanler}
				/>
			</Layout>
		</>
	)
}

export default Tasks
