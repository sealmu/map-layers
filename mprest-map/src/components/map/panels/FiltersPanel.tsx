import { useMemo } from "react";
import { FilterModal, type FiltersPanelProps } from "@mprest/map";

const FiltersPanel = ({ api }: FiltersPanelProps) => {
  const {
    filterData,
    isFilterModalOpen,
    handleFilterChange,
    closeFilterModal,
  } = api;

  const modalKey = useMemo(() => {
    // Create a key that changes when filterData changes
    return JSON.stringify(filterData);
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