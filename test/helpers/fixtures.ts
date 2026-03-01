export interface UserFixture {
  username?: string
  email?: string
  password?: string
  active?: boolean
}

export interface NestedArrayUserFixture {
  username: string
  contacts: Array<{ email: string }>
  password: string
}

export const USERS: UserFixture[] = [
  {
    username: 'JohnSmith',
    email: 'john.smith@gmail.com',
    password: 'j0hnNYb0i'
  },
  {
    username: 'Robert Miller',
    email: 'bob@robertmiller.com',
    password: '@b0B#b0B$b0B%'
  },
  {
    email: 'john.smith@gmail.com'
  },
  {
    email: 'bob@robertmiller.com'
  },
  {
    email: 'john.smith@gmail.com',
    username: 'JohnSmith'
  },
  {
    email: 'john.smith2000@gmail.com',
    username: 'JohnSmith'
  }
]

export const USERS_REGEX: UserFixture[] = [
  {
    username: 'JohnSmith0',
    email: 'john0smith@gmail.com',
    password: 'j0hnNYb0i0'
  },
  {
    username: 'JohnSmith',
    email: 'john.smith@gmail.com',
    password: 'j0hnNYb0i'
  }
]

export const USERS_PARTIAL_FILTER_EXPRESSION: UserFixture[] = [
  {
    username: 'JaneSmith',
    email: 'jane.smith@gmail.com',
    password: 'j4n3Ru13s',
    active: true
  },
  {
    username: 'Robert Miller',
    email: 'bob@robertmiller.com',
    password: '@b0B#b0B$b0B%',
    active: true
  },
  {
    username: 'JaneSmith',
    email: 'jane.smith@gmail.com',
    password: 'j4n3Ru13s',
    active: false
  }
]

export const USERS_NESTED_ARRAY: NestedArrayUserFixture[] = [
  {
    username: 'JenSmith',
    contacts: [{ email: 'jen.smith@gmail.com' }],
    password: 'OMGitsJen'
  },
  {
    username: 'SamSmith',
    contacts: [{ email: 'sam.smith@gmail.com' }],
    password: 'SamRules1000'
  }
]
