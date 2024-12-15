async function collection(source, target, options = {}) {
    const { config, utils } = options;
    const { tauriFetch: fetch } = utils;
    const { momo_token: momoToken, notepad_id: notepadId } = config;

    if (!momoToken || momoToken.length === 0) {
        throw "Momo token not found";
    }
    if (!notepadId || notepadId.length === 0) {
        throw "Notepad ID not found";
    }

    // 获取当前云词本的内容
    let getRes = await fetch(
        `https://open.maimemo.com/open/api/v1/notepads/${encodeURIComponent(notepadId)}`,
        {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${momoToken}`,
                "Accept": "application/json",
            },
        },
    );

    if (getRes.ok) {
        const result = getRes.data;

        if (!result.success) {
            throw `Error fetching notepad: ${JSON.stringify(result.errors)}`;
        }

        const notepad = result.data.notepad;
        if (!notepad) {
            throw "Notepad not found";
        }

        let currentContent = notepad.content || "";
        let wordsArray = currentContent ? currentContent.split("\n") : [];

        // 避免重复添加
        if (!wordsArray.includes(source)) {
            wordsArray.push(source);
        } else {
            return true;
        }

        let newContent = wordsArray.join("\n");

        let body = {
            notepad: {
                status: notepad.status || "UNPUBLISHED",
                title: notepad.title || "pot",
                brief: notepad.brief || "add from pot",
                tags: notepad.tags || ["其他"],
                content: newContent,
            },
        };

        // 发送更新云词本请求
        let postRes = await fetch(
            `https://open.maimemo.com/open/api/v1/notepads/${encodeURIComponent(notepadId)}`,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${momoToken}`,
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                body: {
                    type: "Json",
                    payload: body,
                },
            },
        );

        if (postRes.ok) {
            const postResult = postRes.data;

            if (postResult.success && postResult.data.notepad) {
                return true;
            } else {
                throw `Error updating notepad: ${JSON.stringify(postResult.errors)}`;
            }
        } else {
            throw `Http Request Error\nHttp Status: ${postRes.status}\n${JSON.stringify(postRes.data)}`;
        }
    } else {
        throw `Http Request Error\nHttp Status: ${getRes.status}\n${JSON.stringify(getRes.data)}`;
    }
}
