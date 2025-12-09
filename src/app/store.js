import { configureStore } from '@reduxjs/toolkit'
import todosReducer from '../features/todos/todosSlice'
import cmsPageReducer from '../features/cms/cmsPageSlice'

export default configureStore({
  reducer: {
    todos: todosReducer,
    cmsPage: cmsPageReducer,
  },
})