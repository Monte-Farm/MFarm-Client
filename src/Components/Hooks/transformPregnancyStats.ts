type PeriodKey = "day" | "week" | "month" | "year";

export function transformPregnancyStatsForChart(stats: any, period: PeriodKey) {
    const { pregnanciesByPeriod, farrowingsByPeriod, abortionsByPeriod } = stats;

    const getLabel = (item: any) => {
        const id = item._id;
        switch (period) {
            case "day": return id.day || "Desconocido";
            case "week": return `Sem ${id.week}-${id.year}`;
            case "month": return `${id.month}/${id.year}`;
            case "year": return `${id.year}`;
            default: return "";
        }
    };

    const periods = new Set([
        ...pregnanciesByPeriod.map((p: any) => getLabel(p)),
        ...farrowingsByPeriod.map((f: any) => getLabel(f)),
        ...abortionsByPeriod.map((a: any) => getLabel(a)),
    ]);

    const pregnancyData: any[] = [];
    const farrowingData: any[] = [];
    const abortionData: any[] = [];

    periods.forEach(label => {
        const preg = pregnanciesByPeriod.find((p: any) => getLabel(p) === label)?.totalPregnancies || 0;
        const far = farrowingsByPeriod.find((f: any) => getLabel(f) === label)?.totalFarrowings || 0;
        const abo = abortionsByPeriod.find((a: any) => getLabel(a) === label)?.totalAbortions || 0;

        pregnancyData.push({ x: label, y: preg });
        farrowingData.push({ x: label, y: far });
        abortionData.push({ x: label, y: abo });
    });

    return [
        { id: "Embarazos", data: pregnancyData },
        { id: "Partos", data: farrowingData },
        { id: "Abortos", data: abortionData },
    ];
}