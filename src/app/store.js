import { configureStore } from '@reduxjs/toolkit'
import todosReducer from '../features/todos/todosSlice'
import pageLayoutsReducer from '../features/cms/pageLayoutsSlice'

export default configureStore({
  reducer: {
    todos: todosReducer,
    pageLayouts: pageLayoutsReducer,
  },
})