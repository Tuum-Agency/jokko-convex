import { Metadata } from 'next'
import AssignmentsClient from './_components/assignments-client'

export const metadata: Metadata = {
    title: 'Assignments | Jokko',
    description: 'View and manage assignments',
}

export default function AssignmentsPage() {
    return <AssignmentsClient />
}
