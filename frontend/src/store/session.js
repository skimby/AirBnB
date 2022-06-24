import { csrfFetch } from './csrf';

// TYPES
const SET_USER = 'users/setUser';
const REMOVE_USER = 'users/removeUser';

// ACTIONS
export const setUser = (user) => {
    return {
        type: SET_USER,
        payload: user
    }
}

export const removeUser = () => {
    return {
        type: REMOVE_USER,
    }
}

// THUNK ACTIONS
export const loginUser = (payload) => async (dispatch) => {
    const res = await csrfFetch('/users/login', {
        method: 'POST',
        body: JSON.stringify(payload)
    });

    if (res.ok) {
        const parsedRes = await res.json();
        console.log(parsedRes)
        dispatch(setUser(parsedRes))
        return parsedRes;
    }
}

export const restoreUser = () => async (dispatch) => {
    const res = await csrfFetch('/session');
    const parsedRes = await res.json();
    dispatch(setUser(parsedRes.user));
    return res;
}

// how to catch backend errors
export const signup = (user) => async (dispatch) => {
    const { firstName, lastName, email, password } = user;
    const response = await csrfFetch("/users/signup", {
        method: "POST",
        body: JSON.stringify({ firstName, lastName, email, password }),
    });
    const data = await response.json();
    dispatch(setUser(data));
    return response;
};

// export const signup = ({ firstName, lastName, email, password }) => async (dispatch) => {
//     // const { email, password } = user;

//     const res = await csrfFetch('/users/signUp', {
//         method: "POST",
//         body: JSON.stringify({
//             firstName,
//             lastName,
//             email,
//             password
//         })
//     });
//     if (res.ok) {
//         const parsedRes = await res.json();
//         // console.log(parsedRes)
//         dispatch(setUser(parsedRes))
//         return parsedRes;
//     }
// }

// INITIAL STATE
const initialState = {
    user: null
}

// REDUCERS
const sessionReducer = (state = initialState, action) => {
    switch (action.type) {
        case SET_USER:
            const setUserState = { ...state };
            setUserState.user = action.payload;
            return setUserState;
        case REMOVE_USER:
            return initialState;
        default:
            return state;
    }
}

export default sessionReducer;
