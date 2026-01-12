import { FilterModal, type FiltersPanelProps } from "@mprest/map";

const FiltersPanel = ({ api }: FiltersPanelProps) => {
  const {
    filterData,
    isFilterModalOpen,
    handleFilterChange,
    closeFilterModal,
  } = api;

  return (
    <>
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={closeFilterModal}
        filterData={filterData}
        onFilterChange={handleFilterChange}
      />
    </>
  );
};

export default FiltersPanel;