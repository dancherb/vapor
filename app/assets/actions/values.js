export const changeValue = (label, value) => {
    return {
        type: "change_value",
        payload: { label, value }
    }
};

export const changeObjectValue = (object, label, value) => {
  return {
      type: "change_object_value",
      payload: { object, label, value }
  }
};

export const persistValue = (label, value) => {
    return {
        type: "persist_value",
        payload: { label, value }
    }
};

export const changePost = (object, label, value) => {
    return {
        type: "change_post",
        payload: { object, label, value }
    }
};

export const addImage = (label, value) => {
    return {
        type: "add_image",
        payload: { label, value }
    }
};
