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
    } = api;

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
            />
        </>
    );
};

export default SearchPanel;