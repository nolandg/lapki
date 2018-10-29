/* eslint-disable import/no-extraneous-dependencies */

// The rich text area plugin
import slate from 'ory-editor-plugins-slate';

// The image plugin
import { imagePlugin } from 'ory-editor-plugins-image';

// The video plugin
import video from 'ory-editor-plugins-video';

// The spacer plugin
import spacer from 'ory-editor-plugins-spacer';

// The divider plugin
import divider from 'ory-editor-plugins-divider';

// The native handler plugin
import native from 'ory-editor-plugins-default-native';

// Image uploader
import imageUploadService from './imageUploadService';

import defaultImage from './default-image.png';

// Define which plugins we want to use (all of the above)
export default {
  defaultPlugin: slate(),
  plugins: {
    content: [
      slate(),
      imagePlugin({
        allowInlineNeighbours: false,
        imageUpload: imageUploadService(defaultImage),
        maxFileSize: 10e6,
      }),
      video,
      spacer,
      divider,
    ],

    // If you pass the native key the editor will be able to handle native drag and drop events (such as links, text, etc).
    // The native plugin will then be responsible to properly display the data which was dropped onto the editor.
    native,
  },
};
