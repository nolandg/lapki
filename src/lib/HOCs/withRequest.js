import React from 'react';
import { RequestContextConsumer } from '../contexts';

// function withRequest(WrappedComponent) {
//   return props => (
//     <RequestContextConsumer>
//       { (value) => {
//         const { userAgent } = value;
//
//         return (
//           <WrappedComponent
//             userAgent={userAgent}
//             {...props}
//           />
//         );
//       }}
//     </RequestContextConsumer>
//   );
// }

function withRequest(WrappedComponent) {
  class withRequestClass extends React.Component {
    render() {
      return (
        <RequestContextConsumer>
          { (value) => {
            const { userAgent } = value;

            return (
              <WrappedComponent
                userAgent={userAgent}
                {...this.props}
              />
            );
          }}
        </RequestContextConsumer>
      );
    }
  }

  withRequestClass.propTypes = {
  };

  return withRequestClass;
}


export { withRequest };
