import React from "react";

type Props = {
  frdo?: React.HTMLAttributes<HTMLElement>["className"];
  "my-id"?: React.ReactNode;
  frush: React.ReactNode;
};

export default function MyComponent(props: Props) {
  const { frdo, frush } = props;
  return (
    <p className={`my-style ${frdo}`}>
      test
      {props["my-id"]}
      things
      {frush && <React.Fragment>frog</React.Fragment>}
    </p>
  );
}
