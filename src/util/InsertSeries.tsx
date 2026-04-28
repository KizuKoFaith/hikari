import supabase from "@/client/SupabaseClient";

interface Series {
    title_jp: string;
    title_en?: string;
    cover_url: string;
    status?: string;
    type?: string;
    author?: string;
    artist?: string;
    publisher?: string;
    genres?: string[];
    published_at?: string;
    description?: string;
}

const InsertSeries = async (series: Series) => {
    const { data, error } = await supabase.from("series").insert([series]);

    if (error) {
        throw new Error(`${error.message} | ${error.code} | ${error.hint}`);
    }

    return data;
};

export default InsertSeries;