import { PageHeader } from '../components/PageHeader'
import { SecurityTable } from '../components/SecurityTable'
import {
  useOrganizations, useDepartments, useUserGroups,
} from '../hooks/useSecurity'

export function OrganizationsPage() {
  const { data = [] } = useOrganizations()
  return (
    <div>
      <PageHeader title="Organizations" subtitle="Multi-organization hierarchy" />
      <SecurityTable rows={data} columns={[
        { key: 'name', label: 'Name' },
        { key: 'code', label: 'Code' },
        { key: 'level', label: 'Level' },
        { key: 'timezone', label: 'Timezone' },
      ]} />
    </div>
  )
}

export function DepartmentsPage() {
  const { data = [] } = useDepartments()
  return (
    <div>
      <PageHeader title="Departments" subtitle="Department management" />
      <SecurityTable rows={data} columns={[
        { key: 'name', label: 'Department' },
        { key: 'code', label: 'Code' },
      ]} />
    </div>
  )
}

export function UserGroupsPage() {
  const { data = [] } = useUserGroups()
  return (
    <div>
      <PageHeader title="User Groups" subtitle="Group-based permission assignment" />
      <SecurityTable rows={data} columns={[
        { key: 'name', label: 'Group' },
        { key: 'slug', label: 'Slug' },
      ]} />
    </div>
  )
}
