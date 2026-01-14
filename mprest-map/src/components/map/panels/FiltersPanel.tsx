import { useState, useEffect } from "react";
import { FilterModal, type FiltersPanelProps } from "@mprest/map";

const FiltersPanel = ({ api }: FiltersPanelProps) => {
  const {
    filterData,
    isFilterModalOpen,
    handleFilterChange,
    closeFilterModal,
  } = api;

  const [modalKey, setModalKey] = useState(0);

  useEffect(() => {
    setModalKey(k => k + 1);
  }, [filterData]);

  return (
    <>
      <FilterModal
        key={modalKey}
        isOpen={isFilterModalOpen}
        onClose={closeFilterModal}
        filterData={filterData}
        onFilterChange={handleFilterChange}
      />
    </>
  );
};

export default FiltersPanel;