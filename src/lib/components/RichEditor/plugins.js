/* eslint-disable import/no-extraneous-dependencies */
import slate from 'ory-editor-plugins-slate';
import { imagePlugin } from 'ory-editor-plugins-image';
import video from 'ory-editor-plugins-video';
import spacer from 'ory-editor-plugins-spacer';
import divider from 'ory-editor-plugins-divider';
import native from 'ory-editor-plugins-default-native';
import imageUploadService from './imageUploadService';
import customContent from './customPlugin';

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
      customContent,
    ],

    // If you pass the native key the editor will be able to handle native drag and drop events (such as links, text, etc).
    // The native plugin will then be responsible to properly display the data which was dropped onto the editor.
    native,
  },
};
