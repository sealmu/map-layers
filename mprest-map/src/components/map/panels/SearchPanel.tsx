import SearchModal from "./SearchModal";
import type { SearchPanelProps } from "../../../types";

const SearchPanel = ({ api }: SearchPanelProps) => {
    const {
        searchData,
        isSearchModalOpen,
        searchResults,
        searchQuery,
        handleLayerToggle,
        performSearch,
        closeSearchModal,
    } = api.searchPanel;

    return (
        <>
            <SearchModal
                isOpen={isSearchModalOpen}
                onClose={closeSearchModal}
                searchData={searchData}
                searchResults={searchResults}
                searchQuery={searchQuery}
                onLayerToggle={handleLayerToggle}
                onSearch={performSearch}
                onSelectEntity={api.entities.selectEntity}
            />
        </>
    );
};

export default SearchPanel;