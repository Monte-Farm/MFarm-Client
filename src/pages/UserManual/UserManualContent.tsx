import React from "react";
import { ManualCategory } from "./userManualSections";
import UserManualSection from "./UserManualSection";

interface Props {
  categories: ManualCategory[];
}

const UserManualContent = ({ categories }: Props) => {
  return (
    <div className="manual-content">
      {categories.map((category) =>
        category.sections.map((section) => (
          <UserManualSection key={section.id} section={section} />
        ))
      )}
    </div>
  );
};

export default UserManualContent;
